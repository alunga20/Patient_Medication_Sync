import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../src/App";

afterEach(cleanup);

describe("demo medication dashboard", () => {
  it("shows the sample schedule and patient-reported summary", () => {
    render(<App />);

    expect(screen.getByRole("region", { name: "Medication schedule" })).toBeTruthy();
    expect(screen.getByText("3", { selector: "strong" })).toBeTruthy();
    expect(screen.getByText("1 of 3")).toBeTruthy();
    expect(screen.getByText("33%")).toBeTruthy();
    expect(screen.getByText("Reported-taken share")).toBeTruthy();
  });

  it("surfaces a clear daily check-in prompt and next action", () => {
    render(<App />);

    expect(screen.getByText("Ready for your check-in?")).toBeTruthy();
    expect(screen.getByText("Next action")).toBeTruthy();
    expect(screen.getByText("2 sample doses need attention")).toBeTruthy();
  });

  it("propagates a reported-taken update to the summary, medication list, and history", () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole("button", { name: "Mark reported taken" })[0]);
    expect(screen.getByText("2 of 3")).toBeTruthy();
    expect(screen.getByText("67%")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Medications" }));
    expect(screen.getAllByText("Reported taken")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "History" }));
    const activity = screen.getByRole("article");
    expect(within(activity).getByText("Example medicine A")).toBeTruthy();
    expect(within(activity).getByText("Scheduled 08:00 · Reported taken")).toBeTruthy();
  });

  it("records snoozes without changing medication instructions", () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole("button", { name: "Snooze demo" })[0]);
    expect(screen.getByText("Snoozed")).toBeTruthy();
    expect(screen.getByText("Follow the label supplied by your pharmacy")).toBeTruthy();
    expect(screen.getByText("1 of 3")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("Scheduled 08:00 · Snoozed")).toBeTruthy();
  });

  it("records corrections as no response and updates the summary", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Correct response" }));
    expect(screen.getByText("0 of 3")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("Scheduled 14:00 · No response recorded")).toBeTruthy();
  });

  it("shows an empty history before any in-session updates", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("No activity recorded yet")).toBeTruthy();
  });

  it("completes demo sync with an explicit no-pharmacy status", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Sync demo" }));
    const syncingButton = screen.getByRole("button", { name: "Syncing demo…" }) as HTMLButtonElement;
    expect(syncingButton.disabled).toBe(true);

    expect(
      await screen.findByText(/Demo sync completed\. Sample records only; no external pharmacy was contacted\./)
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sync demo" })).toBeTruthy();
  });

  it("discards demo dose changes when the app is remounted", () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Mark reported taken" })[0]);
    expect(screen.getByText("2 of 3")).toBeTruthy();

    unmount();
    render(<App />);

    expect(screen.getByText("1 of 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("No activity recorded yet")).toBeTruthy();
  });
});
