from fastapi import FastAPI, Form, Request
from fastapi.middleware.cors import CORSMiddleware
import json
from collections import deque

app = FastAPI()

# Enable CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

@app.api_route('/pipelines/parse', methods=['GET', 'POST'])
async def parse_pipeline(request: Request):
    """
    Accepts a pipeline payload and returns:
    {"num_nodes": int, "num_edges": int, "is_dag": bool}

    Payload sources supported:
    - POST with form data: Content-Type: application/x-www-form-urlencoded (field 'pipeline')
    - POST with JSON: { "pipeline": "...json string..." } or { "nodes": [...], "edges": [...] }
    - GET with query parameter: /pipelines/parse?pipeline=...jsonstring...
    """
    pipeline_str = None
    pipeline_obj = None

    try:
        if request.method == 'POST':
            content_type = request.headers.get('content-type', '')
            if 'application/json' in content_type:
                try:
                    body = await request.json()
                except Exception:
                    body = None
                if isinstance(body, dict):
                    # Either { pipeline: str } or a pipeline object itself
                    if 'pipeline' in body:
                        pipeline_str = body.get('pipeline')
                    else:
                        # Body is already the pipeline object
                        pipeline_obj = body
                else:
                    pipeline_str = None
            elif 'application/x-www-form-urlencoded' in content_type or 'multipart/form-data' in content_type:
                try:
                    form = await request.form()
                    pipeline_str = form.get('pipeline')
                except Exception:
                    pipeline_str = None
        # GET or fallback to query params
        if pipeline_str is None:
            pipeline_str = request.query_params.get('pipeline')
    except Exception:
        pipeline_str = None

    nodes = []
    edges = []
    if pipeline_obj is not None:
        if isinstance(pipeline_obj.get('nodes'), list):
            nodes = pipeline_obj.get('nodes')
        if isinstance(pipeline_obj.get('edges'), list):
            edges = pipeline_obj.get('edges')
    elif pipeline_str:
        try:
            parsed = json.loads(pipeline_str) if isinstance(pipeline_str, str) else pipeline_str
            if isinstance(parsed, dict):
                n = parsed.get('nodes')
                e = parsed.get('edges')
                if isinstance(n, list):
                    nodes = n
                if isinstance(e, list):
                    edges = e
        except Exception:
            # Leave nodes/edges empty on parse error
            pass

    num_nodes = len(nodes)
    num_edges = len(edges)

    # Compute DAG using Kahn's algorithm on valid node ids only
    node_ids = set()
    for n in nodes:
        nid = n.get('id') if isinstance(n, dict) else None
        if isinstance(nid, str):
            node_ids.add(nid)

    # Build adjacency and indegree for edges whose endpoints exist in node_ids
    adj = {nid: [] for nid in node_ids}
    indeg = {nid: 0 for nid in node_ids}

    is_dag = True
    for e in edges:
        if not isinstance(e, dict):
            continue
        s = e.get('source')
        t = e.get('target')
        if not isinstance(s, str) or not isinstance(t, str):
            continue
        if s not in node_ids or t not in node_ids:
            continue
        if s == t:
            # self-loop creates a cycle
            is_dag = False
            break
        adj[s].append(t)
        indeg[t] += 1

    if is_dag:
        q = deque([nid for nid in node_ids if indeg[nid] == 0])
        visited = 0
        while q:
            u = q.popleft()
            visited += 1
            for v in adj[u]:
                indeg[v] -= 1
                if indeg[v] == 0:
                    q.append(v)
        is_dag = (visited == len(node_ids))

    return {"num_nodes": num_nodes, "num_edges": num_edges, "is_dag": is_dag}
