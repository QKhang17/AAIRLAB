/* Small-screen panel navigation for comparison workspaces. */
(() => {
    const review = document.body.classList.contains('review-page');
    const workspace = document.querySelector(review ? '.review-workspace' : '.ra-layout');
    if (!workspace) return;
    const panels = review
        ? [['pdf', 'PDF document', '.pdf-panel'], ['results', 'Compare results', '.comparison-panel']]
        : [['pdf', 'PDF document', '.ra-pdf-panel'], ['results', 'Compare results', '.ra-ai-column']];
    const controls = document.createElement('div');
    controls.className = 'comparison-view-switch';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Workspace view');
    for (const [view, label, selector] of panels) {
        const sections = [...workspace.querySelectorAll(selector)];
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.dataset.view = view;
        sections.forEach((section, index) => { section.id ||= `comparison-${view}-${index}`; });
        button.setAttribute('aria-controls', sections.map(section => section.id).join(' '));
        button.setAttribute('aria-pressed', String(view === 'results'));
        button.addEventListener('click', () => {
            document.body.dataset.comparisonView = view;
            controls.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
            window.dispatchEvent(new Event('resize'));
        });
        controls.append(button);
    }
    document.body.dataset.comparisonView = 'results';
    workspace.before(controls);
})();
