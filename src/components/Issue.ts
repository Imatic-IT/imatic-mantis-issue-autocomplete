import { z } from 'zod';
import { getSettings } from '../utils/utils';

const issueResponseSchema = z.object({
  id: z.string(),
  summary: z.string(),
  project: z.string(),
  status: z.string(),
  statusColor: z.string(),
});

export type issueModel = z.infer<typeof issueResponseSchema>;

const settingsSchema = z.object({
  url: z.string(),
});

type settingsModel = z.infer<typeof settingsSchema>;

export class Issue {
  private searchValue: string = '';
  private issues: issueModel[] = [];
  private settings!: settingsModel;

  constructor() {
    this.init();
  }

  private async init() {
    this.settings = settingsSchema.parse(getSettings());
  }

  private async fetchIssues(): Promise<issueModel[]> {
    try {
      const response = await fetch(this.settings.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({ issue_search_autocomplete: this.searchValue }),
      });
      if (response.ok) {
        const data = await response.json();
        return issueResponseSchema.array().parse(data);
      } else {
        console.error(`Error fetching issues: ${response.statusText}`);
        return [];
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Error fetching issues: ${error.message}`);
      } else {
        throw new Error(`Error fetching issues: ${error}`);
      }
      return [];
    }
  }

  public async searchIssues(value: string): Promise<issueModel[]> {
    this.searchValue = value;
    this.issues = await this.fetchIssues();
    return this.issues;
  }
}
