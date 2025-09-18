import './submit.css';
import React from 'react';
import { useStore } from '../../store/store';
import { ResultToast } from './resultToast';

export const SubmitButton = () => {
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);
    const [submitting, setSubmitting] = React.useState(false);
    const [toastData, setToastData] = React.useState(null);

    const getCandidateBases = () => {
        // Prefer backend on :8000 when running CRA dev server (:3000) to avoid 404s on relative path
        try {
            if (typeof window !== 'undefined') {
                const { protocol, hostname, port } = window.location || {};
                if (port === '3000') {
                    return [`${protocol}//${hostname}:8000`, ''];
                }
            }
        } catch (_) {
            // ignore errors and fall through
        }
        return [''];
    };

    const handleClick = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const payload = { nodes: nodes || [], edges: edges || [] };
        const pipelineStr = JSON.stringify(payload);
        const bases = getCandidateBases();
        let success = false;
        for (const base of bases) {
            const url = `${base}/pipelines/parse`;
            // 1) Try POST with JSON body sending the object directly
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) {
                    const data = await res.json().catch(() => ({}));
                    console.log('Pipeline parsed (POST json):', data);
                    if (data && typeof data === 'object') {
                        setToastData({
                            num_nodes: data.num_nodes ?? 0,
                            num_edges: data.num_edges ?? 0,
                            is_dag: !!data.is_dag,
                        });
                    }
                    success = true;
                    break;
                }
            } catch (_) { /* noop */ }

            // 2) Try POST with form-encoded body (fallback)
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ pipeline: pipelineStr }).toString(),
                });
                if (res.ok) {
                    const data = await res.json().catch(() => ({}));
                    console.log('Pipeline parsed (POST form):', data);
                    if (data && typeof data === 'object') {
                        setToastData({
                            num_nodes: data.num_nodes ?? 0,
                            num_edges: data.num_edges ?? 0,
                            is_dag: !!data.is_dag,
                        });
                    }
                    success = true;
                    break;
                }
            } catch (_) { /* noop */ }

            // 3) Fallback: GET with query string
            try {
                const qs = new URLSearchParams({ pipeline: pipelineStr }).toString();
                const res = await fetch(`${url}?${qs}`, { method: 'GET' });
                if (res.ok) {
                    const data = await res.json().catch(() => ({}));
                    console.log('Pipeline parsed (GET query):', data);
                    if (data && typeof data === 'object') {
                        setToastData({
                            num_nodes: data.num_nodes ?? 0,
                            num_edges: data.num_edges ?? 0,
                            is_dag: !!data.is_dag,
                        });
                    }
                    success = true;
                    break;
                }
            } catch (_) { /* noop */ }
        }

        if (!success) {
            console.error('All attempts to reach /pipelines/parse failed.');
        }
        setSubmitting(false);
    };

    return (
        <div className="submit__container">
            <button type="submit" onClick={handleClick} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
            </button>
            {toastData ? (
                <ResultToast data={toastData} onClose={() => setToastData(null)} />
            ) : null}
        </div>
    );
};
