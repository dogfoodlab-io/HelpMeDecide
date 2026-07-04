export default function App() {
  return (
    <main className="app-shell">
      <section className="composer">
        <p className="eyebrow">HelpMeDecide.ai</p>
        <h1>What are you deciding?</h1>
        <textarea aria-label="Decision prompt" placeholder="Describe the decision, options, constraints, and people involved." />
        <button type="button">Create decision workspace</button>
      </section>
    </main>
  );
}
