import { CollaboratorView } from "./app/CollaboratorView";
import { Composer } from "./app/Composer";
import { PaywallModel } from "./app/PaywallModel";
import { Workspace } from "./app/Workspace";
import { useDecisionWorkspace } from "./state/useDecisionWorkspace";

export default function App() {
  const workspace = useDecisionWorkspace();

  return (
    <main className="app-shell">
      {!workspace.decision ? (
        <Composer onCreate={workspace.createFromPrompt} />
      ) : (
        <>
          <Workspace
            decision={workspace.decision}
            frameworkRun={workspace.frameworkRun}
            dossier={workspace.dossier}
          />
          <div className="supporting-grid">
            <CollaboratorView />
            <PaywallModel />
          </div>
        </>
      )}
    </main>
  );
}
