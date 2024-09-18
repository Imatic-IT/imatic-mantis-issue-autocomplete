import {Issue} from "./Issue";
import {getSettings} from "../utils/utils";
import {z} from "zod";
import {html, render} from 'lit-html';
import debounce from 'lodash/debounce';
import {issueModel} from "./Issue";

const settingsSchema = z.object({
    autocomplete_issue_window_settings: z.record(z.string()),
    min_search_length: z.number(),
    min_search_length_message: z.string(),
    no_issue_found_message: z.string(),
    search_for_issue_message: z.string(),
});

type settingsModel = z.infer<typeof settingsSchema>;

export class IssueAutocomplete {
    private overlayElement!: HTMLElement;
    private originalInput!: HTMLInputElement;
    private originalInputName: string = 'dest_bug_id';
    private clonedInput!: HTMLInputElement;
    private clonedInputId: string = 'issue-autocomplete';
    private issueListElement!: HTMLUListElement;
    private settings!: settingsModel;

    constructor() {
        this.init();
    }

    private async init() {
        this.settings = settingsSchema.parse(getSettings());
        this.originalInput = document.querySelector(`input[name="${this.originalInputName}"]`)! as HTMLInputElement;
        this.cloneInputElement();
        this.createListIssuesOverlay();

        this.clonedInput.addEventListener('input', debounce(this.onInput, 300) as EventListener);

        document.addEventListener('keydown', this.closeOnEsc);
        document.addEventListener('click', this.closeOnClick, {passive: true});

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

    private cloneInputElement(): void {
        if (this.originalInput) {
            this.clonedInput = this.originalInput.cloneNode(true) as HTMLInputElement;
            this.clonedInput.id = this.clonedInputId;
            this.clonedInput.placeholder = this.settings.search_for_issue_message;
            this.clonedInput.name = 'issue_autocomplete';
            this.originalInput.insertAdjacentElement('afterend', this.clonedInput);
        }
    }

    private onIssueClick = (event: MouseEvent) => {
        const button = (event.target as HTMLElement).closest('.issue-button');
        if (button) {
            this.setRelatedIssueIdIntoTheInput(button.getAttribute('data-id')!);
        }
    }

    private renderIssues(issues: issueModel[]): void {
        const template = html`
            ${issues.length > 0
                    ? issues.map(issue => html`
                        <li class="issue-item">
                            <button class="issue-button" data-id="${issue.id}">${issue.id}</button>
                            |
                            <span class="">${issue.project}</span> |
                            <span class="issue-summary">${issue.summary}</span>
                        </li>
                    `)
                    : html`
                        <li class="no-issues-item">${this.settings.no_issue_found_message}</li>`}
        `;
        render(template, this.issueListElement);
    }

    private setRelatedIssueIdIntoTheInput(issueId: string): void {
        this.originalInput.value = issueId;
        this.hide();
    }

    private createListIssuesOverlay(): void {
        this.overlayElement = document.createElement('div')

        Object.assign(this.overlayElement.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: this.settings.autocomplete_issue_window_settings.width,
            height: this.settings.autocomplete_issue_window_settings.height,
            transform: 'translate(-50%, -50%)',
            background: this.settings.autocomplete_issue_window_settings.background,
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

        if (value.length < this.settings.min_search_length) {
            this.renderShortMessage();
        } else {
            const issue = new Issue();
            const issues = await issue.searchIssues(value);
            this.renderIssues(issues);
        }
    }

    private renderShortMessage(): void {

        const template = html`
            <li class="no-issues-item">${this.settings.min_search_length_message}</li>
        `;
        render(template, this.issueListElement);
        return;
    }

    public destroy(): void {
        this.clonedInput.removeEventListener('input', this.onInput);
        document.removeEventListener('keydown', this.closeOnEsc);
        document.removeEventListener('click', this.closeOnClick);
        this.issueListElement.removeEventListener('click', this.onIssueClick);
    }
}