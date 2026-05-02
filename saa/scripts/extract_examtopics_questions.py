#!/usr/bin/env python3
import argparse
import json
import re
import time
from html import unescape
from pathlib import Path
from typing import Iterable

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.examtopics.com/exams/amazon/aws-certified-solutions-architect-associate-saa-c03/view/"


class ExtractionError(RuntimeError):
    pass


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value)).strip()


def page_url(page_number: int) -> str:
    if page_number == 1:
        return BASE_URL
    return f"{BASE_URL}{page_number}/"


def read_local_page(source_dir: Path, page_number: int) -> tuple[str, Path] | None:
    for candidate in (
        source_dir / f"{page_number}.html",
        source_dir / f"page-{page_number}.html",
        source_dir / f"page_{page_number}.html",
    ):
        if candidate.exists():
            return candidate.read_text(encoding="utf-8"), candidate
    return None


def fetch_page(session: requests.Session, page_number: int) -> str:
    response = session.get(page_url(page_number), timeout=30)
    response.raise_for_status()
    return response.text


def load_page(session: requests.Session, source_dir: Path, page_number: int) -> tuple[str, str]:
    local_html = read_local_page(source_dir, page_number)
    if local_html is not None:
        html, path = local_html
        return html, f"local:{path}"
    return fetch_page(session, page_number), page_url(page_number)


def detect_page_count(soup: BeautifulSoup) -> int | None:
    text = soup.get_text(" ", strip=True)
    match = re.search(r"Viewing page\s+\d+\s+out of\s+(\d+)\s+pages", text)
    if match:
        return int(match.group(1))
    return None


def parse_question_number(card: BeautifulSoup) -> int:
    header = card.select_one(".card-header")
    if not header:
        raise ExtractionError("question card is missing .card-header")

    match = re.search(r"Question\s+#(\d+)", header.get_text(" ", strip=True))
    if not match:
        raise ExtractionError("question card header is missing question number")
    return int(match.group(1))


def most_voted_letters(card: BeautifulSoup) -> set[str]:
    letters: set[str] = set()
    for script in card.select(".voted-answers-tally script[type='application/json']"):
        if not script.string:
            continue
        try:
            votes = json.loads(script.string)
        except json.JSONDecodeError:
            continue
        for vote in votes:
            if vote.get("is_most_voted"):
                for letter in str(vote.get("voted_answers", "")):
                    if letter.isalpha():
                        letters.add(letter.upper())

    for badge in card.select(".most-voted-answer-badge"):
        choice = badge.find_parent("li")
        letter = choice.select_one(".multi-choice-letter") if choice else None
        if letter and letter.get("data-choice-letter"):
            letters.add(letter["data-choice-letter"].strip().upper())
    return letters


def parse_choices(card: BeautifulSoup) -> list[dict]:
    voted_letters = most_voted_letters(card)
    choices = []

    for item in card.select(".question-choices-container li.multi-choice-item"):
        letter_node = item.select_one(".multi-choice-letter")
        if not letter_node:
            continue

        letter = normalize_text(letter_node.get("data-choice-letter") or letter_node.get_text())
        letter = letter.rstrip(".").upper()

        for removable in item.select(".multi-choice-letter, .most-voted-answer-badge"):
            removable.extract()

        choices.append(
            {
                "letter": letter,
                "text": normalize_text(item.get_text(" ", strip=True)),
                "isMostVoted": letter in voted_letters,
                "isHiddenCorrect": "correct-hidden" in item.get("class", []),
            }
        )

    return choices


def parse_questions(html: str, source: str) -> tuple[list[dict], int | None]:
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select(".exam-question-card")
    if not cards:
        title = normalize_text(soup.title.get_text()) if soup.title else "untitled page"
        if "Validation" in title or "Captcha" in soup.get_text(" ", strip=True):
            raise ExtractionError(f"{source} returned a validation/captcha page")
        raise ExtractionError(f"{source} did not contain any .exam-question-card elements")

    questions = []
    for card in cards:
        body = card.select_one(".card-body.question-body")
        question = body.select_one(".card-text") if body else None
        if question is None:
            raise ExtractionError(f"{source} has a question card without .card-text")

        question_number = parse_question_number(card)
        questions.append(
            {
                "number": question_number,
                "question": normalize_text(question.get_text(" ", strip=True)),
                "choices": parse_choices(card),
            }
        )

    return questions, detect_page_count(soup)


def write_questions(output_dir: Path, questions: Iterable[dict]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for question in questions:
        output_path = output_dir / f"q{question['number']:04d}.json"
        output_path.write_text(
            json.dumps(question, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )


def make_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": BASE_URL,
        }
    )
    return session


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract ExamTopics SAA-C03 questions.")
    parser.add_argument("--output-dir", type=Path, default=Path("saa/questions"))
    parser.add_argument("--source-dir", type=Path, default=Path("source"))
    parser.add_argument("--pages", type=int, help="Number of pages to extract. Defaults to page count detected from page 1.")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between remote page fetches.")
    parser.add_argument("--best-effort", action="store_true", help="Keep saved pages and stop cleanly when a later page is blocked.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    session = make_session()
    total_pages = args.pages
    total_written = 0

    page_number = 1
    while True:
        if total_pages is not None and page_number > total_pages:
            break

        try:
            html, source = load_page(session, args.source_dir, page_number)
            questions, detected_pages = parse_questions(html, source)
            if total_pages is None:
                total_pages = detected_pages or page_number
            write_questions(args.output_dir, questions)
        except Exception as exc:
            if args.best_effort and page_number > 1:
                print(f"stopped at page {page_number}: {exc}")
                break
            raise

        total_written += len(questions)
        print(f"page {page_number}: wrote {len(questions)} questions from {source}")

        page_number += 1
        if total_pages is not None and page_number > total_pages:
            break
        if read_local_page(args.source_dir, page_number) is None:
            time.sleep(args.delay)

    print(f"done: wrote {total_written} questions to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
