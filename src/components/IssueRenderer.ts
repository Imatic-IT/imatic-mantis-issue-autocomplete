import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { issueModel } from './Issue';
import { getSettings } from '../utils/utils';
import { z } from 'zod';
import { CSS_CLASSES } from './constatns';

const settingsSchema = z.object({
  autocompleteIssueWindowSettings: z.record(z.string()),
  minSearchLength: z.number(),
  minSearchLengthMessage: z.string(),
  noIssueFoundMessage: z.string(),
  searchForIssueMessage: z.string(),
  searchInputNames: z.array(z.string()),
  fieldSeparator: z.string(),
});

type settingsModel = z.infer<typeof settingsSchema>;

export class IssueRenderer {
  private issueListElement: HTMLElement;
  private settings: settingsModel;

  constructor(container: HTMLElement) {
    this.issueListElement = container;
    this.settings = settingsSchema.parse(getSettings());
  }

  public renderIssues(issues: issueModel[]): void {
    const currentIssueId = this.getIssueIdFromUrl();

    const template = html`
      ${issues.length > 0
        ? issues.map((issue) => {
            const currentIssue =
              currentIssueId &&
              currentIssueId === parseInt(issue.id, 10).toString();
            return html`
              <li class="${CSS_CLASSES.issuesItem}">
                <button
                  class="issue-button fa fa-external-link"
                  data-id="${issue.id}"
                ></button>

                <span>${unsafeHTML(this.settings.fieldSeparator)}</span>

                <a
                  href="view.php?id=${issue.id}"
                  target="_blank"
                  class="${CSS_CLASSES.issueLink} ${currentIssue ? CSS_CLASSES.currentIssue : ''}"
                >
                  ${issue.id}
                </a>

                <span>${unsafeHTML(this.settings.fieldSeparator)}</span>

                <span>${issue.project}</span>

                <span>${unsafeHTML(this.settings.fieldSeparator)}</span>

                <i class="fa fa-square fa-status-box ${issue.statusColor}"></i>
                <span class="${issue.statusColor}">${issue.status}</span>

                <span>${unsafeHTML(this.settings.fieldSeparator)}</span>

                <span>${issue.summary}</span>
              </li>
            `;
          })
        : html` <li class="${CSS_CLASSES.noIssuesItem}">
            ${this.settings.noIssueFoundMessage}
          </li>`}
    `;

    render(template, this.issueListElement);
  }

  private getIssueIdFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }
}
