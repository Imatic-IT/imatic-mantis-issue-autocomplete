export function getSettings(): string {
    const el = document.querySelector<HTMLInputElement>("#imaticIssueAutocomplete")!;

    const data = el.dataset.data; // dataset môže byť undefined
    if (!data) {
        throw new Error("Missing data attribute on #imaticIssueAutocomplete element");
    }

    return JSON.parse(data) as string;
}
