import { useState } from "react";

export default function BulkImport() {
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Bulk Import</h2>
          <p className="text-muted mb-0">Import operational data in bulk.</p>
        </div>

        <span className="badge text-bg-warning">Prototype</span>
      </div>

      <div className="alert alert-info">
        <strong>Coming soon:</strong> Import validation and processing will be
        available once the import template and backend are finalized.
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="fw-semibold mb-3">Upload a file</h5>

          <div
            className="border rounded p-5 text-center"
            style={{ borderStyle: "dashed" }}
          >
            <div className="fs-1 mb-2">📄</div>

            <h6>Select your import file</h6>

            <p className="text-muted small">Excel (.xlsx) or CSV (.csv)</p>

            <input
              type="file"
              className="form-control mt-3"
              accept=".xlsx,.csv"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
            />

            {selectedFile && (
              <div className="alert alert-secondary mt-3 mb-0 text-start">
                <strong>Selected file:</strong> {selectedFile.name}
                <div className="small text-muted">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            )}
          </div>

          <div className="d-flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              className="btn btn-primary"
              disabled
              title="Import processing is not implemented yet"
            >
              Import Data — Coming Soon
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled
              title="The official import template has not been finalised"
            >
              Download Template — Coming Soon
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h5 className="fw-semibold mb-3">Import workflow</h5>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="fw-semibold mb-2">1. Select file</div>
                <p className="text-muted small mb-0">
                  Choose the prepared Excel or CSV file.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="fw-semibold mb-2">2. Validate data</div>
                <p className="text-muted small mb-0">
                  Check required fields, formats and scheduling conflicts.
                </p>
                <span className="badge text-bg-secondary">Not implemented</span>
              </div>
            </div>

            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="fw-semibold mb-2">3. Review and import</div>
                <p className="text-muted small mb-0">
                  Review detected issues before confirming the import.
                </p>
                <span className="badge text-bg-secondary">Not implemented</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
