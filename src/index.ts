import {IssueAutocomplete} from "./components/IssueAutocomplete";

(function () {
    let issueAutocomplete: IssueAutocomplete | null = null;
    issueAutocomplete = new IssueAutocomplete();
    window.addEventListener('unload', () => {
        if (issueAutocomplete) {
            issueAutocomplete.destroy();
            issueAutocomplete = null;
        }
    });
})();
