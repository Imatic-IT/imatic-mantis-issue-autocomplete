import {IssueWhisperer} from "./components/IssueWhisperer";

(function () {
    let issueWhisperer: IssueWhisperer | null = null;
    issueWhisperer = new IssueWhisperer();
    window.addEventListener('unload', () => {
        if (issueWhisperer) {
            issueWhisperer.destroy();
            issueWhisperer = null;
        }
    });
})();
