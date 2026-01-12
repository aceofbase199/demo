# Everyday Expense Tracker (.NET)

A minimal, voice-forward expense tracker prototype built with ASP.NET Core and a lightweight HTML/CSS/JS UI.

## Features
- Period stats for today, week, and month
- Transaction history with quick filters
- Add expense/income with categories, tags, and location
- Voice capture flow with confirmation + retry

## Run locally
```bash
dotnet run
```
Then open `http://localhost:5000` (or the URL shown in the console).

## Notes
- Voice capture uses the browser Speech Recognition API when available.
- `/api/transcribe` is a minimal stub that returns a suggestion from the transcript.
