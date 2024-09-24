import { Issue, issueModel } from "./Issue";
import { getSettings } from "../utils/utils";
import { z } from "zod";
import { html, render } from 'lit-html';
import debounce from 'lodash/debounce';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

const settingsSchema = z.object({
    autocompleteIssueWindowSettings: z.record(z.string()),
    minSearchLength: z.number(),
    minSearchLengthMessage: z.string(),
    noIssueFoundMessage: z.string(),
    searchForIssueMessage: z.string(),
    searchInputNames: z.array(z.string()),
    fieldSeparator: z.string(),
    submitOnSelect: z.boolean(),
});

type settingsModel = z.infer<typeof settingsSchema>;

export class IssueAutocomplete {
    private overlayElement!: HTMLElement;
    private activeInput!: HTMLInputElement;
    private issueListElement!: HTMLUListElement;
    private settings!: settingsModel;
    private overlaySearchInput!: HTMLInputElement;

    constructor() {
        this.init();
    }

    private async init() {
        this.settings = settingsSchema.parse(getSettings());
        this.createListIssuesOverlay();
        this.initializeSearchInputs();

        document.addEventListener('keydown', this.closeOnEsc);
        document.addEventListener('click', this.closeOnClick, { passive: true });
        this.issueListElement.addEventListener('click', this.onIssueClick);
    }

    private show(): void {
        requestAnimationFrame(() => {
            this.overlayElement.style.display = 'block';
        });
    }

    private hide(): void {
        requestAnimationFrame(() => {
            this.overlayElement.style.display = 'none';
        });
    }

    private initializeSearchInputs(): void {
        const searchInputSettings: string[] = this.settings.searchInputNames.concat('issue-search-input');

        searchInputSettings.forEach(name => {
            const inputs = Array.from(document.querySelectorAll(`input[name="${name}"]`)) as HTMLInputElement[];

            inputs.forEach((input: HTMLInputElement) => {
                input.addEventListener('input', debounce(this.onInput, 300) as EventListener);
                input.addEventListener('focus', (event: Event) => {
                    if (input !== this.overlaySearchInput) {
                        this.setActiveInput(event.target as HTMLInputElement);
                    }
                });
            });
        });
    }

    private setActiveInput(input: HTMLInputElement): void {
        this.activeInput = input;
    }

    private getActiveInput(): HTMLInputElement {
        return this.activeInput;
    }

    private closeOnEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            this.hide();
        }
    }

    private closeOnClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (!this.overlayElement.contains(target)) {
            this.hide();
        }
    }

    private onIssueClick = (event: MouseEvent) => {
        if (!(event.target instanceof HTMLButtonElement)) {
            return;
        }

        const activeInput: HTMLInputElement = this.getActiveInput();
        if (!activeInput) {
            return;
        }
        const target: HTMLButtonElement = event.target as HTMLButtonElement;
        activeInput.value = target.dataset.id!;

        if (this.settings.submitOnSelect) {
            this.submitActiveInput(activeInput);
        }

        this.hide();
    }

    private submitActiveInput(input: HTMLInputElement): void {
        const form: HTMLFormElement = input.closest('form')!;
        if (form) {
            form.submit(); // Submit the form
        } else {
            throw new Error('No form found');
        }
    }

    private getIssueIdFromUrl(): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    private renderIssues(issues: issueModel[]): void {
        const currentIssueId = this.getIssueIdFromUrl();

        const template = html`
            ${issues.length > 0
            ? issues.map(issue => {
                const isHighlighted = currentIssueId && currentIssueId === parseInt(issue.id, 10).toString();
                return html`
                        <li class="issue-item ${isHighlighted ? 'issue-highlighted' : ''}">
                            <button class="issue-button fa fa-external-link"
                                    data-id="${issue.id}">
                            </button>

                            <span>${unsafeHTML(this.settings.fieldSeparator)}</span>

                            <a href="view.php?id=${issue.id}" target="_blank">${issue.id}</a>

                            <span>${unsafeHTML(this.settings.fieldSeparator)}</span>

                            <span>${issue.project}</span>

                            <span>${unsafeHTML(this.settings.fieldSeparator)}</span>

                            <i class="fa fa-square fa-status-box ${issue.statusColor}"></i>
                            <span class="${issue.statusColor}">${issue.status}</span>

                            <span>${unsafeHTML(this.settings.fieldSeparator)}</span>

                            <span class="issue-summary">${issue.summary}</span>
                        </li>
                    `;
            })
            : html`
                    <li class="no-issues-item">${this.settings.noIssueFoundMessage}</li>`}
        `;
        render(template, this.issueListElement);
    }

    private createListIssuesOverlay(): void {
        this.overlayElement = document.createElement('div');

        const searchInput = document.createElement('input');
        searchInput.setAttribute('type', 'text');
        searchInput.classList.add('issue-search-input');
        searchInput.name = 'issue-search-input';

        this.overlaySearchInput = searchInput;

        Object.assign(this.overlayElement.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: this.settings.autocompleteIssueWindowSettings.width,
            height: this.settings.autocompleteIssueWindowSettings.height,
            transform: 'translate(-50%, -50%)',
            background: this.settings.autocompleteIssueWindowSettings.background,
            zIndex: '10000',
            overflow: 'auto',
            boxSizing: 'border-box',
            display: 'none',
        });

        this.issueListElement = document.createElement('ul');

        Object.assign(this.issueListElement.style, {
            listStyle: 'none',
            margin: 'auto',
            padding: '0',
            width: '100%',
        });
        this.overlayElement.appendChild(searchInput);
        this.overlayElement.appendChild(this.issueListElement);
        document.body.appendChild(this.overlayElement);
    }

    private onInput = async (event: Event) => {
        this.show();
        const value = (event.target as HTMLInputElement).value.trim();
        if (!value) {
            this.hide();
            return;
        }

        const searchInput = document.querySelector('.issue-search-input') as HTMLInputElement;
        searchInput.value = value;

        if (value.length < this.settings.minSearchLength) {
            this.renderShortMessage();
        } else {
            const issue = new Issue();
            const issues = await issue.searchIssues(value);
            this.renderIssues(issues);
        }
    }

    private renderShortMessage(): void {
        const template = html`
            <li class="no-issues-item">${this.settings.minSearchLengthMessage}</li>
        `;
        render(template, this.issueListElement);
        return;
    }

    public destroy(): void {
        const searchInputSettings: string[] = this.settings.searchInputNames.concat('issue-search-input');

        searchInputSettings.forEach(name => {
            const inputs = Array.from(document.querySelectorAll(`input[name="${name}"]`)) as HTMLInputElement[];
            inputs.forEach((input: HTMLInputElement) => {
                input.removeEventListener('input', debounce(this.onInput, 300) as EventListener); // Odstránenie event listenerov pre input
            });
        });

        document.removeEventListener('keydown', this.closeOnEsc);
        document.removeEventListener('click', this.closeOnClick);
        this.issueListElement.removeEventListener('click', this.onIssueClick);
    }
}
