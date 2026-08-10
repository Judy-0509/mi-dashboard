# SigmaIntel Excel Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read approved SigmaIntel `db.PLC` Excel files locally through xlwings, accumulate validated facts in a gitignored SQLite database, and publish aggregate and detail JSON for the existing static dashboard only after an explicit user approval.

**Architecture:** Keep the data path intentionally small: one stdlib Python pipeline module owns filename parsing, xlwings extraction, SQLite transactions, validation, and JSON export; one CLI module owns the Monday workflow and the narrow Git publish boundary. The existing Vite dashboard remains static and reads exported aggregate JSON at build time through its existing `src/data/dashboard.json` import; `public/data/v1` is the API/AI surface that Vite copies into `site/data/v1`.

**Tech Stack:** Python 3.10+ standard library (`sqlite3`, `csv`, `json`, `hashlib`, `pathlib`, `unittest`), xlwings 0.36.8, Excel desktop, React 19, TypeScript 6, Vite 8, GitHub Actions, GitHub Pages.

## Global Constraints

- Only files manually placed in repository-root `input/` are eligible source files.
- Open and read source workbooks only with xlwings; never use pandas or openpyxl for source Excel.
- Read only the `db.PLC` worksheet and require its exact 55-column header contract from `sigmaintel.md`.
- Interpret a single case-insensitive filename token such as `- Jun.26` as the ordering month `2026-06`; never rename the workbook and never fall back to modification time.
- Keep `data/mi_dashboard.db`, raw Excel, `archive/processed/`, `reports/`, `edm.md`, and `internal-publish-remote.txt` local and gitignored.
- `edm.md` is exact-filename metadata only: do not open links, download from them, or edit the file.
- A workbook is one SQLite transaction. Invalid rows, duplicate headers, missing headers, or conflicting fact values roll back the entire workbook and prevent all JSON replacement and Git publishing.
- Exact duplicate facts from different workbooks preserve both raw lineage rows but contribute once to `forecast_fact`; same normalized identity with a different volume is a blocking conflict.
- Internal real and external synthetic deployments share the identical JSON schema. External data must never include EDM links.
- The user must explicitly answer `y` to the local CLI prompt before any `git add`, `git commit`, or `git push` is run.
- Real-data publishing requires `internal-publish-remote.txt` to contain the exact `origin` remote URL on one line; a missing or nonmatching allowlist blocks Git commands.
- No server API, DuckDB, Parquet, network EDM integration, automatic source deletion, or converters for other research firms are part of this implementation.

---

## File Map

| Path | Responsibility |
|---|---|
| `requirements-data.txt` | Pin xlwings for the local Excel workflow; all other pipeline dependencies are Python standard library. |
| `scripts/sigma_pipeline.py` | The single data module: schema contract, filename parsing, xlwings reader, SQLite transactions, reconciliation, JSON export, and plain-text report generation. |
| `scripts/update_sigmaintel.py` | CLI entry point: locate `input/` workbooks, call the pipeline, show the report, request approval, stage only generated JSON, commit, and push. |
| `tests/test_sigma_pipeline.py` | `unittest` coverage for parsing, synthetic xlwings workbook reading, idempotency, rollback, aggregation, and export contracts. |
| `tests/test_sigma_publish.py` | `unittest` coverage proving no Git command occurs without affirmative approval and only allowed paths are staged. |
| `.gitignore` | Excludes all internal sources, local DB, raw lineage, reports, and `edm.md`. |
| `edm.example.md` | Tracked, link-free format reference for the local-only `edm.md`. |
| `internal-publish-remote.example.txt` | Tracked, link-free format reference for the local-only exact origin allowlist. |
| `대시보드 데이터 업데이트.bat` | Weekly Windows entry point for the approved local workflow. |
| `prototype/mi-dashboard-shadcn/public/data/v1/` | Tracked synthetic manifest, dictionary, aggregates, and one detail file; the internal exporter overwrites the same contract with real data. |
| `prototype/mi-dashboard-shadcn/src/data/dashboard.json` | Generated dashboard aggregate contract. It remains synthetic in the external repository and is overwritten by the internal exporter. |
| `prototype/mi-dashboard-shadcn/src/data/production.ts` | Typed dashboard reader; uses real exported history for real data and allows the existing deterministic history only when `dataMode` is `synthetic`. |
| `prototype/mi-dashboard-shadcn/scripts/check-production.mjs` | Verifies the dashboard data contract without the retired CSV/URL import route. |
| `prototype/mi-dashboard-shadcn/scripts/update-dashboard-data.mjs` | Delete: it bypasses the approved xlwings/SQLite trust boundary. |
| `prototype/mi-dashboard-shadcn/package.json` | Removes `data:update`, retains frontend verification, and adds the standard-library data test command. |
| `.github/workflows/pages.yml` | Uses the internal Windows self-hosted runner to validate generated JSON, run tests, build Vite, upload, and deploy Pages. |
| `README.md` and `prototype/mi-dashboard-shadcn/README.md` | Replace CSV/URL instructions with the approved Excel-to-JSON workflow and Pages runner prerequisites. |

## Stable Data Contracts

`scripts/sigma_pipeline.py` must define these exported names; later tasks use these exact signatures.

```python
from dataclasses import dataclass
from pathlib import Path
from typing import Any

@dataclass(frozen=True)
class PlcRow:
    snapshot_month: str
    target_year: int
    target_quarter: int
    data_status: str
    company: str
    brands: str | None
    series: str | None
    sub_series: str | None
    model: str | None
    region: str
    volume_mu: float
    spec_values: dict[str, str | float | None]
    raw_values: dict[str, Any]

@dataclass(frozen=True)
class ImportResult:
    path: Path
    filename_month: str
    source_rows: int
    fact_rows_added: int
    duplicate_fact_rows: int
    raw_rows_added: int

@dataclass(frozen=True)
class PipelineResult:
    imported: tuple[ImportResult, ...]
    skipped: tuple[Path, ...]
    warnings: tuple[str, ...]
    latest_snapshot_month: str | None
    report_path: Path
    generated_changed: bool

```

Function signatures: `parse_filename_month(path: Path) -> str`, `discover_workbooks(input_dir: Path) -> list[Path]`, `read_plc_workbook(path: Path) -> list[dict[str, Any]]`, `normalize_plc_row(raw: dict[str, Any], row_number: int) -> PlcRow`, `run_pipeline(repo_root: Path) -> PipelineResult`, `export_json(conn: sqlite3.Connection, output_root: Path, dashboard_path: Path) -> str | None`, and `export_synthetic_contract(output_root: Path, dashboard_path: Path) -> None`.

The exporter writes the following stable shapes. `vendor` means lower-case key `apple`, `samsung`, `xiaomi`, `oppo`, `vivo`, `transsion`, or `others`; every numeric volume is rounded to one decimal place.

```json
{
  "schemaVersion": 1,
  "dataMode": "real",
  "asOf": "2026-06",
  "generatedAt": "2026-08-10T09:00:00Z",
  "datasets": {
    "productionQuarterly": "aggregates/production-quarterly.json",
    "forecastHistory": "aggregates/forecast-history.json",
    "details": ["details/2026-06.json"]
  }
}
```

```json
{
  "dataMode": "real",
  "asOf": "2026-06",
  "focusQuarter": "2026 Q3",
  "executiveSummary": ["2026 Q3 현재 누적 Forecast는 366.0Mu로, 직전 스냅샷 대비 +10.0Mu 조정됨", "업체별로 Apple +4.0Mu가 가장 큰 상향, OPPO -1.0Mu가 가장 큰 하향임"],
  "quarterlyProduction": [
    {"quarter": "2026 Q3", "apple": 64.0, "samsung": 66.0, "xiaomi": 47.0, "oppo": 34.0, "vivo": 33.0, "transsion": 32.0, "others": 90.0}
  ],
  "forecastHistory": {
    "2026 Q3": [
      {"quarter": "2026 Q3", "period": "26-05월", "apple": 60.0, "samsung": 63.0, "xiaomi": 45.0, "oppo": 33.0, "vivo": 32.0, "transsion": 30.0, "others": 88.0}
    ]
  }
}
```

The external repository's `dashboard.json` keeps `"dataMode": "synthetic"`; its values are demonstrative only. `data-dictionary.json` contains all 55 original header names, normalized field names, type, unit, allowed-value rule, and the sample values from `sigmaintel.md`.

### Task 1: Establish the local boundary and input contract

**Files:**
- Create: `requirements-data.txt`
- Create: `edm.example.md`
- Create: `scripts/sigma_pipeline.py`
- Create: `tests/test_sigma_pipeline.py`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `PLC_COLUMNS`, `SPEC_COLUMNS`, `parse_filename_month(path: Path) -> str`, `discover_workbooks(input_dir: Path) -> list[Path]`, `normalize_plc_row(raw: dict[str, Any], row_number: int) -> PlcRow`.
- Consumes: the 55-column mapping in `sigmaintel.md`.

- [ ] **Step 1: Add the minimal local-only dependencies and ignore rules**

Create `requirements-data.txt` with exactly:

```text
xlwings==0.36.8
```

Append these exact entries to `.gitignore`:

```gitignore
input/
archive/processed/
data/*.db
data/*.db-shm
data/*.db-wal
data/publish-candidate/
reports/
edm.md
internal-publish-remote.txt
```

Create `edm.example.md` with the exact header and one non-link example:

```markdown
| 조사기관 | Version | 파일명 | EDM 링크 | 처리 상태 |
| --- | --- | --- | --- | --- |
| SigmaIntel | 2026-06 | PLC - Jun.26.xlsx | 사내 미리보기 주소 | 처리 완료 |
```

Create tracked `internal-publish-remote.example.txt` with exactly:

```text
https://github.com/your-internal-org/mi-dashboard.git
```

- [ ] **Step 2: Write the failing filename and row-normalization tests**

In `tests/test_sigma_pipeline.py`, create a `unittest.TestCase` with these tests:

```python
def test_parse_filename_month_uses_the_single_month_token(self) -> None:
    self.assertEqual(
        parse_filename_month(Path("PLC - Jun.26.xlsx")), "2026-06"
    )

def test_discover_workbooks_sorts_by_filename_month_not_mtime(self) -> None:
    with TemporaryDirectory() as directory:
        root = Path(directory)
        (root / "PLC - Jun.26.xlsx").touch()
        (root / "PLC - Jan.26.xlsx").touch()
        self.assertEqual(
            [path.name for path in discover_workbooks(root)],
            ["PLC - Jan.26.xlsx", "PLC - Jun.26.xlsx"],
        )

def test_normalize_rejects_negative_volume(self) -> None:
    row = valid_raw_row(**{"Volume(mil.)": -0.1})
    with self.assertRaisesRegex(ValueError, "Volume\\(mil.\\) 행 2"):
        normalize_plc_row(row, 2)
```

Define the test helper exactly so every fixture remains a valid 55-column long-format row:

```python
def valid_raw_row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {header: "-" for header in PLC_COLUMNS}
    row.update({
        "version": "2026-06", "Year": "Y26", "Quarter": "26Q3F",
        "Company": "Apple", "Region": "Global", "Volume(mil.)": 1.31,
    })
    row.update(overrides)
    return row
```

- [ ] **Step 3: Run the tests to confirm the contract is absent**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline -v
```

Expected: `ModuleNotFoundError: No module named 'scripts.sigma_pipeline'`.

- [ ] **Step 4: Implement the exact 55-column contract and pure normalization functions**

Create `scripts/sigma_pipeline.py`. Define the header tuple in this exact order:

```python
PLC_COLUMNS = (
    "version", "Year", "Quarter", "Company", "Brands", "Series", "Sub Series", "Models",
    "MainDisplaySize", "MainDisplayResolution1", "MainDisplayResolution2", "Panel Type", "Backplane", "Bonding",
    "Foldable", "FoldType", "Panel Form", "Panel Sup", "TP Spec", "TP Sup", "SubDisplaySize",
    "SubDisplayResolution1", "SubDisplayResolution2", "SubDisplayPanelType", "Chipset Spec", "ChipsetSup", "Network",
    "FingerSpec", "Finger Sup", "FaceID(3D) Spec", "FaceID(3D) Sup", "Camera Spec-Rear 1st",
    "Camera Spec-Rear 2nd", "Camera Spec-Rear 3rd", "Camera Spec-Rear 4th", "Camera Spec-Rear 5th",
    "Camera Sup-Rear 1st", "Camera Sup-Rear 2nd", "Camera Sup-Rear 3rd", "Camera Sup-Rear 4th",
    "Camera Sup-Rear 5th", "Camera Spec-Front", "Camera Sup-Front", "DRAM Type", "NANDType", "Memory Type",
    "DRAM PKG Type", "Memory Package+Interface", "Dram&Nand Spec", "Price with standar version (CNY)",
    "Price Segment", "Launced Time", "IDH/ODM", "Region", "Volume(mil.)",
)
```

Define `SPEC_COLUMNS` as every header from `MainDisplaySize` through `IDH/ODM`, excluding `Region` and `Volume(mil.)`. Map `Company` to a lower-case vendor key with this fixed function, so unknown companies do not fragment the dashboard:

```python
def vendor_key(company: str) -> str:
    key = company.strip().casefold()
    return {
        "apple": "apple", "samsung": "samsung", "xiaomi": "xiaomi",
        "oppo": "oppo", "vivo": "vivo", "transsion": "transsion",
    }.get(key, "others")
```

Define `FIELD_NAMES` in this same module from the exact 55-row `db.PLC 매핑` column in `sigmaintel.md`, with every source header as the key and every documented normalized name as its value; use that one dictionary for both `PlcRow.spec_values` and `data-dictionary.json`.

Use the following parser behavior exactly:

```python
MONTH_PATTERN = re.compile(
    r"(?i)(?<![a-z])(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.(\d{2})(?!\d)"
)

def parse_filename_month(path: Path) -> str:
    matches = MONTH_PATTERN.findall(path.name)
    if len(matches) != 1:
        raise ValueError(f"파일명에서 하나의 월·연도 표기를 찾을 수 없습니다: {path.name}")
    month_text, short_year = matches[0]
    month = ("jan feb mar apr may jun jul aug sep oct nov dec".split().index(month_text.casefold()) + 1)
    return f"20{short_year}-{month:02d}"
```

`normalize_plc_row` must strip text, map an empty string or `-` to `None` only for optional values, require `version` to match `^20\\d{2}-(0[1-9]|1[0-2])$`, require `Year` to match `^Y(20)?\\d{2}$`, parse `Quarter` as `YYQ[1-4]` optionally followed by `F`, set `data_status` to `forecast` only for `F`, and reject non-finite or negative volume. Preserve every original key/value in `raw_values`.

- [ ] **Step 5: Run the focused contract tests**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline -v
```

Expected: the three tests pass. Add tests in the same file for missing/multiple filename month tokens, invalid `version`, invalid `Quarter`, and `-` becoming `None`; all must pass.

- [ ] **Step 6: Commit the contract boundary**

```powershell
git add .gitignore requirements-data.txt edm.example.md internal-publish-remote.example.txt scripts/sigma_pipeline.py tests/test_sigma_pipeline.py
git commit -m "feat: define SigmaIntel input contract"
```

### Task 2: Read a `db.PLC` workbook through xlwings only

**Files:**
- Modify: `scripts/sigma_pipeline.py`
- Modify: `tests/test_sigma_pipeline.py`

**Interfaces:**
- Consumes: `PLC_COLUMNS` from Task 1.
- Produces: `read_plc_workbook(path: Path) -> list[dict[str, Any]]`.

- [ ] **Step 1: Write a failing xlwings integration test using a synthetic workbook**

Add this test; it creates the Excel file with xlwings, not openpyxl:

```python
def test_read_plc_workbook_reads_only_the_contract_sheet(self) -> None:
    with TemporaryDirectory() as directory:
        path = Path(directory) / "PLC - Jun.26.xlsx"
        app = xw.App(visible=False, add_book=False)
        try:
            book = app.books.add()
            sheet = book.sheets[0]
            sheet.name = "db.PLC"
            sheet.range("A1").value = [list(PLC_COLUMNS), list(valid_raw_row().values())]
            book.save(path)
            book.close()
        finally:
            app.quit()
        rows = read_plc_workbook(path)
    self.assertEqual(rows, [valid_raw_row()])
```

Import `xlwings as xw` in the test module. This test is intentionally run only on the Windows machine that has desktop Excel.

- [ ] **Step 2: Run the xlwings test to verify it fails**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline.SigmaPipelineTests.test_read_plc_workbook_reads_only_the_contract_sheet -v
```

Expected: `NameError: name 'read_plc_workbook' is not defined`.

- [ ] **Step 3: Implement a read-only, hidden xlwings adapter**

Add this implementation to `scripts/sigma_pipeline.py`:

```python
def read_plc_workbook(path: Path) -> list[dict[str, Any]]:
    import xlwings as xw

    app = xw.App(visible=False, add_book=False)
    app.display_alerts = False
    app.screen_updating = False
    book = None
    try:
        book = app.books.open(str(path), read_only=True, update_links=False)
        try:
            sheet = book.sheets["db.PLC"]
        except Exception as error:
            raise ValueError(f"db.PLC 시트가 없습니다: {path.name}") from error
        values = sheet.range("A1").expand().value
        if not isinstance(values, list) or len(values) < 2:
            raise ValueError(f"db.PLC 데이터가 비어 있습니다: {path.name}")
        headers = [str(value).strip() if value is not None else "" for value in values[0]]
        if len(headers) != len(set(headers)):
            raise ValueError(f"db.PLC 헤더가 중복되었습니다: {path.name}")
        if len(headers) != len(PLC_COLUMNS) or set(headers) != set(PLC_COLUMNS):
            raise ValueError(f"db.PLC 헤더 55개가 계약과 다릅니다: {path.name}")
        return [dict(zip(headers, row, strict=True)) for row in values[1:] if any(value is not None for value in row)]
    finally:
        if book is not None:
            book.close()
        app.quit()
```

- [ ] **Step 4: Run the adapter tests**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline -v
```

Expected: all parser tests and the synthetic xlwings workbook test pass. Add one test that renames the sheet and asserts `db.PLC 시트가 없습니다`.

- [ ] **Step 5: Commit the Excel adapter**

```powershell
git add scripts/sigma_pipeline.py tests/test_sigma_pipeline.py
git commit -m "feat: read SigmaIntel workbooks with xlwings"
```

### Task 3: Store normalized rows with transactional lineage and conflict protection

**Files:**
- Modify: `scripts/sigma_pipeline.py`
- Modify: `tests/test_sigma_pipeline.py`

**Interfaces:**
- Consumes: `PlcRow`, `normalize_plc_row`, and `read_plc_workbook`.
- Produces: `initialize_database(conn: sqlite3.Connection) -> None`, `import_workbook(conn: sqlite3.Connection, path: Path, edm_url: str | None) -> ImportResult`, and `reconcile_import(conn: sqlite3.Connection, source_import_id: int) -> None`.

- [ ] **Step 1: Write failing idempotency and conflict tests against a temporary SQLite file**

Add these tests. Use `unittest.mock.patch("scripts.sigma_pipeline.read_plc_workbook")` to return explicit `valid_raw_row()` values, avoiding Excel for database-only cases.

```python
def test_import_keeps_raw_lineage_but_counts_an_exact_fact_once(self) -> None:
    with self.database() as conn, TemporaryDirectory() as directory:
        root = Path(directory)
        first_path = root / "A - Jun.26.xlsx"
        second_path = root / "B - Jul.26.xlsx"
        first_path.write_bytes(b"first workbook")
        second_path.write_bytes(b"second workbook")
        with patch("scripts.sigma_pipeline.read_plc_workbook", return_value=[valid_raw_row()]):
            first = import_workbook(conn, first_path, None)
        with patch("scripts.sigma_pipeline.read_plc_workbook", return_value=[valid_raw_row()]):
            second = import_workbook(conn, second_path, None)
        self.assertEqual(first.fact_rows_added, 1)
        self.assertEqual(second.fact_rows_added, 0)
        self.assertEqual(second.duplicate_fact_rows, 1)
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM plc_raw").fetchone()[0], 2)
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM forecast_fact").fetchone()[0], 1)

def test_conflicting_fact_rolls_back_the_entire_workbook(self) -> None:
    with self.database() as conn, TemporaryDirectory() as directory:
        root = Path(directory)
        first_path = root / "A - Jun.26.xlsx"
        second_path = root / "B - Jul.26.xlsx"
        first_path.write_bytes(b"first workbook")
        second_path.write_bytes(b"second workbook")
        with patch("scripts.sigma_pipeline.read_plc_workbook", return_value=[valid_raw_row()]):
            import_workbook(conn, first_path, None)
        changed = valid_raw_row(**{"Volume(mil.)": 9.99})
        with patch("scripts.sigma_pipeline.read_plc_workbook", return_value=[changed]):
            with self.assertRaisesRegex(ValueError, "충돌"):
                import_workbook(conn, second_path, None)
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM source_import").fetchone()[0], 1)
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM forecast_fact").fetchone()[0], 1)
```

`self.database()` creates a `TemporaryDirectory`, opens `sqlite3.connect(Path(directory) / "test.db")`, calls `initialize_database`, yields the connection, then closes it.

Add this test helper in the same class so every database/export test creates a hashable local source file before patching xlwings:

```python
def import_rows(self, conn: sqlite3.Connection, directory: Path, filename: str, rows: list[dict[str, Any]]) -> ImportResult:
    path = directory / filename
    path.write_bytes(filename.encode("utf-8"))
    with patch("scripts.sigma_pipeline.read_plc_workbook", return_value=rows):
        return import_workbook(conn, path, None)
```

- [ ] **Step 2: Run the database tests to verify they fail**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline.SigmaPipelineTests.test_import_keeps_raw_lineage_but_counts_an_exact_fact_once tests.test_sigma_pipeline.SigmaPipelineTests.test_conflicting_fact_rolls_back_the_entire_workbook -v
```

Expected: `ImportError` for `initialize_database` and `import_workbook`.

- [ ] **Step 3: Implement the minimal SQLite schema and import transaction**

Use four normalized tables plus immutable raw lineage. Store the original 55 fields in `plc_raw.raw_json`; do not duplicate 55 physical columns.

```sql
CREATE TABLE IF NOT EXISTS source_import (
  id INTEGER PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_sha256 TEXT NOT NULL UNIQUE,
  file_month TEXT NOT NULL,
  edm_url TEXT,
  imported_at TEXT NOT NULL,
  source_rows INTEGER NOT NULL,
  fact_rows_added INTEGER NOT NULL,
  duplicate_fact_rows INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS plc_raw (
  id INTEGER PRIMARY KEY,
  source_import_id INTEGER NOT NULL REFERENCES source_import(id),
  row_number INTEGER NOT NULL,
  row_hash TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  UNIQUE(source_import_id, row_number)
);
CREATE TABLE IF NOT EXISTS model (
  id INTEGER PRIMARY KEY,
  identity_hash TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL,
  brands TEXT,
  series TEXT,
  sub_series TEXT,
  model TEXT
);
CREATE TABLE IF NOT EXISTS spec_profile (
  id INTEGER PRIMARY KEY,
  profile_hash TEXT NOT NULL UNIQUE,
  attributes_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS forecast_fact (
  id INTEGER PRIMARY KEY,
  identity_hash TEXT NOT NULL UNIQUE,
  snapshot_month TEXT NOT NULL,
  target_year INTEGER NOT NULL,
  target_quarter INTEGER NOT NULL,
  data_status TEXT NOT NULL CHECK(data_status IN ('actual', 'forecast')),
  vendor TEXT NOT NULL,
  model_id INTEGER NOT NULL REFERENCES model(id),
  spec_profile_id INTEGER NOT NULL REFERENCES spec_profile(id),
  region TEXT NOT NULL,
  volume_mu REAL NOT NULL CHECK(volume_mu >= 0),
  source_import_id INTEGER NOT NULL REFERENCES source_import(id),
  source_row_number INTEGER NOT NULL
);
```

Enable foreign keys before every transaction. Compute `file_sha256` from bytes with `hashlib.sha256(path.read_bytes()).hexdigest()`. Compute `identity_hash` from stable JSON of `snapshot_month`, target period, status, model hierarchy, all spec values, and region, excluding volume and source lineage. For each row: insert raw lineage first; if no fact identity exists insert the fact; if the existing fact has the same volume increment `duplicate_fact_rows`; otherwise raise `ValueError(f"Fact 충돌: {path.name} 행 {row_number}")`. `import_workbook` must use only its named `SAVEPOINT import_workbook`; it must never call `conn.commit()`, `conn.rollback()`, or the connection context manager.

`reconcile_import` must compare the source import's distinct normalized fact identities to the matching canonical `forecast_fact.identity_hash` rows, then compare their volume sums. This intentionally includes a previously stored fact when the current source row is an exact duplicate, so raw lineage can grow without changing the canonical fact total. It raises `ValueError("원본과 Fact 합계가 일치하지 않습니다")` when the two sums differ by more than `0.000001`.

Use an SQLite `SAVEPOINT import_workbook` inside `import_workbook`: release it only after reconciliation, and roll back to it on every exception. This makes direct calls one-workbook transactions and permits `run_pipeline` to wrap all newly discovered files in one outer `BEGIN`/`COMMIT`; a later bad workbook then restores the database to its state before the run while retaining the per-workbook rollback boundary.

- [ ] **Step 4: Run the focused database tests, then the complete Python suite**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline.SigmaPipelineTests.test_import_keeps_raw_lineage_but_counts_an_exact_fact_once tests.test_sigma_pipeline.SigmaPipelineTests.test_conflicting_fact_rolls_back_the_entire_workbook -v
python -m unittest discover -s tests -p "test_*.py" -v
```

Expected: both commands pass. Add one test that imports identical file bytes twice and confirms the second import is skipped by its file hash.

- [ ] **Step 5: Commit transactional storage**

```powershell
git add scripts/sigma_pipeline.py tests/test_sigma_pipeline.py
git commit -m "feat: store SigmaIntel facts transactionally"
```

### Task 4: Export reconciled dashboard and API JSON atomically

**Files:**
- Modify: `scripts/sigma_pipeline.py`
- Modify: `tests/test_sigma_pipeline.py`
- Create: `prototype/mi-dashboard-shadcn/public/data/v1/manifest.json`
- Create: `prototype/mi-dashboard-shadcn/public/data/v1/data-dictionary.json`
- Create: `prototype/mi-dashboard-shadcn/public/data/v1/aggregates/production-quarterly.json`
- Create: `prototype/mi-dashboard-shadcn/public/data/v1/aggregates/forecast-history.json`
- Create: `prototype/mi-dashboard-shadcn/public/data/v1/details/2026-08.json`

**Interfaces:**
- Consumes: populated SQLite tables from Task 3.
- Produces: `export_json(conn, output_root, dashboard_path) -> str | None`; output paths are `manifest.json`, `data-dictionary.json`, `aggregates/production-quarterly.json`, `aggregates/forecast-history.json`, `details/YYYY-MM.json`, and `src/data/dashboard.json`.

- [ ] **Step 1: Write failing export-contract and reconciliation tests**

Add a test that imports two snapshot months for `2026 Q3`, calls `export_json`, and verifies all paths and values:

```python
def test_export_writes_dashboard_and_static_api_contract(self) -> None:
    with self.database() as conn, TemporaryDirectory() as directory:
        temporary = Path(directory)
        self.import_rows(conn, temporary, "A - May.26.xlsx", [valid_raw_row(version="2026-05", **{"Volume(mil.)": 1.0})])
        self.import_rows(conn, temporary, "B - Jun.26.xlsx", [valid_raw_row(version="2026-06", **{"Volume(mil.)": 1.5})])
        root = temporary / "data" / "v1"
        dashboard = temporary / "dashboard.json"
        self.assertEqual(export_json(conn, root, dashboard), "2026-06")
        manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
        current = json.loads(dashboard.read_text(encoding="utf-8"))
        history = json.loads((root / "aggregates" / "forecast-history.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["asOf"], "2026-06")
        self.assertEqual(current["dataMode"], "real")
        self.assertEqual(current["quarterlyProduction"][0]["apple"], 1.5)
        self.assertEqual([point["apple"] for point in history["2026 Q3"]], [1.0, 1.5])
        self.assertTrue((root / "details" / "2026-06.json").exists())
        # Actual at the newest snapshot must win the production bar; forecast-only history remains forecast.
```

Add an Actual/Forecast precedence case in the same test: import an `actual` `26Q3` row and a `forecast` `26Q3F` row at `version="2026-06"`; assert `quarterlyProduction` uses the Actual volume while `forecast-history.json["2026 Q3"]` contains only the Forecast volume. Add a second test calling `export_synthetic_contract(root, dashboard)` and asserting that `manifest.json`, `data-dictionary.json`, both aggregate files, one `details/*.json` file, and the synthetic dashboard all exist and parse with the same top-level contract keys as the real export.

- [ ] **Step 2: Run the exporter test to verify it fails**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline.SigmaPipelineTests.test_export_writes_dashboard_and_static_api_contract -v
```

Expected: FAIL because `export_json` does not create the contract files.

- [ ] **Step 3: Implement the small, query-backed exporter**

`export_json` must first query the latest `snapshot_month`. If no facts exist, return `None` and write nothing. For each target quarter, select Actual rows at that latest snapshot when any exist; otherwise select Forecast rows at that same snapshot. Group the selected rows by `(target_year, target_quarter, vendor)` and order by target period. Select forecast history from `data_status = 'forecast'` only, grouped by `(target_year, target_quarter, snapshot_month, vendor)` and ordered by snapshot month. Do not invent missing months or use UI revision factors.

Use this exact atomic JSON helper for every output:

```python
def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)
```

For each `details/YYYY-MM.json`, join facts to `model` and `spec_profile`, decode `attributes_json`, and emit `snapshotMonth`, `targetYear`, `targetQuarter`, `dataStatus`, `vendor`, model hierarchy, `region`, `volumeMu`, and a `specs` object. Exclude `source_import_id`, source row number, raw values, file names, hashes, and EDM URLs from every public JSON file.

Implement `export_synthetic_contract` in this same module, using a temporary in-memory SQLite database, the same schema, normalization, and `export_json` function, with deterministic rows for every checked-in vendor and quarter. It writes `dataMode: "synthetic"`, never writes EDM data, and is run once in this task to create the tracked external `public/data/v1` JSON files. Do not add a second JSON serializer or JavaScript exporter.

Create the data dictionary from the same `PLC_COLUMNS` and `SPEC_COLUMNS` constants. Every entry must include `sourceColumn`, `field`, `type`, `unit`, `allowedRule`, and the documented sample values. Write a single short schema description for `forecast_fact`, `model`, and `spec_profile` so API and AI consumers understand their joins.

Build `dashboard.json` from the same aggregate objects. Its `focusQuarter` is the latest target quarter with `data_status == "forecast"`; if none exists, use the last quarterly bar. Its two Korean summary bullets compare that focus-quarter total and each vendor between the newest and immediately preceding available snapshot, calculating the percentage from the prior total. Use one decimal and state `비교 가능한 직전 스냅샷이 없음` when only one snapshot exists.

- [ ] **Step 4: Run the export suite**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline.SigmaPipelineTests.test_export_writes_dashboard_and_static_api_contract -v
python -m unittest discover -s tests -p "test_*.py" -v
python -c "from pathlib import Path; from scripts.sigma_pipeline import export_synthetic_contract; export_synthetic_contract(Path('prototype/mi-dashboard-shadcn/public/data/v1'), Path('prototype/mi-dashboard-shadcn/src/data/dashboard.json'))"
```

Expected: both test commands pass; the final command writes tracked synthetic `manifest.json`, `data-dictionary.json`, both aggregate JSON files, one detail JSON file, and synthetic `dashboard.json`. Add a test that fails export if the aggregate total and the matching detail-file total differ.

- [ ] **Step 5: Commit the JSON contract**

```powershell
git add scripts/sigma_pipeline.py tests/test_sigma_pipeline.py prototype/mi-dashboard-shadcn/public/data/v1
git commit -m "feat: export SigmaIntel dashboard JSON"
```

### Task 5: Orchestrate backfill, EDM lineage, reporting, and safe archiving

**Files:**
- Modify: `scripts/sigma_pipeline.py`
- Modify: `tests/test_sigma_pipeline.py`

**Interfaces:**
- Consumes: `parse_filename_month`, `discover_workbooks`, `import_workbook`, and `export_json`.
- Produces: `run_pipeline(repo_root: Path) -> PipelineResult` and `parse_edm_links(path: Path) -> dict[str, str]`.

- [ ] **Step 1: Write failing backfill and missing-EDM tests**

Add a test that creates `input/PLC - Jun.26.xlsx` and `input/PLC - Jan.26.xlsx`, patches `read_plc_workbook`, runs `run_pipeline`, and asserts the import order is January then June and both files now exist below `archive/processed/`. Add a second test with no `edm.md` and assert the pipeline succeeds with a warning containing the Excel filename.

```python
def test_pipeline_backfills_by_filename_month_and_archives_successes(self) -> None:
    with TemporaryDirectory() as directory:
        root = self.make_repo(Path(directory))
        january = root / "input" / "PLC - Jan.26.xlsx"
        june = root / "input" / "PLC - Jun.26.xlsx"
        january.touch()
        june.touch()
        with patch("scripts.sigma_pipeline.read_plc_workbook", return_value=[valid_raw_row()]):
            result = run_pipeline(root)
        self.assertEqual([item.path.name for item in result.imported], [january.name, june.name])
        self.assertTrue((root / "archive" / "processed" / january.name).exists())
        self.assertTrue((root / "archive" / "processed" / june.name).exists())
```

- [ ] **Step 2: Run the orchestration tests to verify they fail**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline.SigmaPipelineTests.test_pipeline_backfills_by_filename_month_and_archives_successes -v
```

Expected: FAIL because `run_pipeline` does not exist.

- [ ] **Step 3: Implement the deterministic local orchestration**

`parse_edm_links` splits each Markdown row on `|`, strips outer empty cells, trims every remaining cell, reads the filename from zero-based index `2`, and reads the Markdown URL from zero-based index `3`. It returns `{file_name: edm_url}` only when index `3` contains exactly one Markdown URL matched by `\]\(([^)]+)\)`. It must never fetch that URL. `run_pipeline` must:

1. Create `input`, `archive/processed`, `data`, and `reports` if missing.
2. Copy an existing `data/mi_dashboard.db` to gitignored `data/mi_dashboard.candidate.db`; when no live DB exists, create the candidate. Initialize only the candidate and load local `edm.md` if present.
3. Discover files in filename-month order. If an input filename has no EDM match, append `EDM 링크 없음: <filename>` to warnings.
4. Skip a file only when its SHA-256 already exists in `source_import`; leave it in `input` and add it to `PipelineResult.skipped`.
5. Before opening the candidate transaction, check every planned `archive/processed/<same-name>` target. If it exists and its SHA-256 equals the input file hash, treat the input as safely skipped and leave it untouched. If it exists with a different hash, stop before DB or JSON work with `ValueError("archive 파일명 충돌: <filename>")`.
6. Begin one outer transaction on the candidate DB. Import each new file through its Task 3 savepoint and collect, but do not move, successful paths.
7. On the first import, validation, archive-collision, or export failure, roll back and delete only the candidate DB and candidate JSON directory; leave the live DB, live JSON, and all input workbooks unchanged, write a report, and raise the same error.
8. After all new files succeed, commit the candidate transaction but keep its connection open. Call `export_json` against that candidate connection into gitignored `data/publish-candidate/`, compare every candidate JSON byte-for-byte with the live dashboard JSON and `public/data/v1`, set `generated_changed` to whether any generated output differs, then close the candidate connection.
9. Before promotion, build an `exists_before` manifest for the live DB and every live generated JSON target, then copy each target that exists to `data/publish-candidate/backup/`. Run all DB/JSON replacements and collected workbook moves in one guarded block, appending every successful replacement or move to a ledger. If any replacement or archive move fails: restore each target that existed before from its backup, delete each live DB/JSON target that did not exist before, and move every workbook already archived in this run back to its original `input/` path. Only when the guarded block succeeds, write `reports/sigmaintel-YYYYMMDD-HHMMSS.txt`.

The report must contain one line per import with filename, parsed filename month, source rows, added facts, duplicate facts, and one line per warning. It must never contain `raw_json`, workbook contents, EDM URL, or SQLite path outside the repository root.

- [ ] **Step 4: Run backfill, skip, rollback, and export tests**

Run:

```powershell
python -m unittest tests.test_sigma_pipeline -v
```

Expected: all pipeline tests pass. Add a test where the second workbook has a negative volume and confirm both workbooks remain in `input`, neither is archived, the live database has no new `source_import` row, and live JSON bytes are unchanged. Add archive-collision tests for same-hash safe skip and different-hash blocking before candidate DB/JSON creation. Patch the JSON replacement helper to raise after its first replacement and assert the live DB plus every live JSON file is restored byte-for-byte from the pre-run state; include a target absent before the run and assert it is removed after rollback. Patch the second archive move to raise and assert the live DB/JSON are restored and every workbook already moved in that run is back in `input/`.

- [ ] **Step 5: Commit local orchestration**

```powershell
git add scripts/sigma_pipeline.py tests/test_sigma_pipeline.py
git commit -m "feat: automate SigmaIntel backfill workflow"
```

### Task 6: Add the explicit approval gate and weekly BAT entry point

**Files:**
- Create: `scripts/update_sigmaintel.py`
- Create: `tests/test_sigma_publish.py`
- Create: `대시보드 데이터 업데이트.bat`

**Interfaces:**
- Consumes: `run_pipeline(repo_root: Path) -> PipelineResult`.
- Produces: `update_and_maybe_publish(repo_root: Path, input_fn: Callable[[str], str], run: Callable[[list[str]], str]) -> int`, `publish_generated_json(repo_root: Path, snapshot_month: str, run: Callable[[list[str]], str]) -> int`, and `main() -> int`.

- [ ] **Step 1: Write failing approval-gate tests**

Use a list-appending fake command runner. The test must prove a declined prompt causes no Git invocation:

```python
def test_declined_approval_never_runs_git(self) -> None:
    commands: list[list[str]] = []
    with TemporaryDirectory() as directory:
        report = Path(directory) / "report.txt"
        report.write_text("검증 완료", encoding="utf-8")
        result = PipelineResult((), (), (), "2026-06", report, True)
        with patch("scripts.update_sigmaintel.run_pipeline", return_value=result):
            exit_code = update_and_maybe_publish(Path(directory), lambda _: "n", lambda command: commands.append(command) or "")
    self.assertEqual(exit_code, 0)
    self.assertEqual(commands, [])

def test_publish_stages_only_generated_json(self) -> None:
    commands: list[list[str]] = []
    with TemporaryDirectory() as directory:
        root = Path(directory)
        allowed = "https://github.com/internal/mi-dashboard.git"
        (root / "internal-publish-remote.txt").write_text(allowed + "\n", encoding="utf-8")
        result = publish_generated_json(root, "2026-06", lambda command: commands.append(command) or (allowed if command[1:3] == ["remote", "get-url"] else ""))
    self.assertEqual(result, 0)
    self.assertEqual(commands[0], ["git", "remote", "get-url", "origin"])
    self.assertEqual(commands[1], ["git", "status", "--porcelain"])
    self.assertEqual(commands[2], ["git", "add", "--", "prototype/mi-dashboard-shadcn/public/data/v1", "prototype/mi-dashboard-shadcn/src/data/dashboard.json"])
    self.assertEqual(commands[3], ["git", "commit", "-m", "data: update SigmaIntel to 2026-06"])
    self.assertEqual(commands[4], ["git", "push", "origin", "HEAD"])
```

Add one test with a missing `internal-publish-remote.txt` and one with a different `git remote get-url origin` result; both must return `2` and make no `git add`, `git commit`, or `git push` call. Add a no-op test where `PipelineResult.generated_changed` is `False`; `update_and_maybe_publish` must return `0`, print `생성 JSON 변경 없음`, and make no prompt or Git call.

Define `confirm_publish(snapshot_month: str, input_fn: Callable[[str], str]) -> bool` in the CLI module so the decision is testable without executing `main`.

- [ ] **Step 2: Run the approval tests to verify they fail**

Run:

```powershell
python -m unittest tests.test_sigma_publish -v
```

Expected: `ModuleNotFoundError: No module named 'scripts.update_sigmaintel'`.

- [ ] **Step 3: Implement the narrow publishing boundary**

Implement `scripts/update_sigmaintel.py` using only `argparse`, `subprocess`, `pathlib`, and `sigma_pipeline`. `confirm_publish` must use this exact prompt and accept only lower-cased `y`:

```python
def confirm_publish(snapshot_month: str, input_fn: Callable[[str], str]) -> bool:
    return input_fn(f"{snapshot_month} 데이터 JSON을 commit/push할까요? [y/N] ").strip().casefold() == "y"
```

`update_and_maybe_publish` calls `run_pipeline`, prints `result.report_path.read_text(encoding="utf-8")`, and returns `0` if no snapshot was produced or `generated_changed` is `False`; the latter prints `생성 JSON 변경 없음` and does not call `input_fn`. It passes its `input_fn` to `confirm_publish`; if declined, it prints `Git 변경 없이 종료했습니다.` and returns `0`. If approved, it returns `publish_generated_json` with its supplied runner. `main` calls `update_and_maybe_publish(repo_root, input, git_run)`, where `git_run` executes `subprocess.run(command, cwd=repo_root, check=True, capture_output=True, text=True).stdout`. Do not use `shell=True`, `git add .`, or a wildcard. `publish_generated_json` first reads the one-line `internal-publish-remote.txt`, then compares it exactly to `run(["git", "remote", "get-url", "origin"]).strip()`; a missing file or mismatch prints `허용되지 않은 origin remote` and returns `2`. Only then does it run `git status --porcelain`, block foreign changes, stage the two generated paths, commit, and execute `git push origin HEAD`.

Create `대시보드 데이터 업데이트.bat` with:

```bat
@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  set "PYTHON=python"
) else (
  set "PYTHON=py -3"
)
%PYTHON% -m pip install -r requirements-data.txt
if errorlevel 1 exit /b 1
%PYTHON% scripts\update_sigmaintel.py
endlocal
```

- [ ] **Step 4: Run CLI tests and a declined local smoke test**

Run:

```powershell
python -m unittest tests.test_sigma_publish -v
cmd /c "echo n|대시보드 데이터 업데이트.bat"
```

Expected: publish unit tests pass; BAT either prints the no-data report and exits `0`, or processes existing input and ends with `Git 변경 없이 종료했습니다.` No Git commit or push is created.

- [ ] **Step 5: Commit the approval gate**

```powershell
git add scripts/update_sigmaintel.py tests/test_sigma_publish.py "대시보드 데이터 업데이트.bat"
git commit -m "feat: add approved SigmaIntel publish workflow"
```

### Task 7: Switch the SigmaIntel dashboard to the exported history contract

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/src/data/dashboard.json`
- Modify: `prototype/mi-dashboard-shadcn/src/data/production.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/components/cumulative-production-chart.tsx`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`
- Modify: `prototype/mi-dashboard-shadcn/package.json`
- Delete: `prototype/mi-dashboard-shadcn/scripts/update-dashboard-data.mjs`

**Interfaces:**
- Consumes: the dashboard JSON shape from Task 4.
- Produces: `getForecastHistory(quarter: string): ForecastHistoryPoint[]`, which returns exported history for `dataMode === "real"`, synthetic history only for an existing synthetic quarter, and throws for an unknown quarter; `getVendorHistoryDeltas(history) -> Record<VendorKey, number | null>`.

- [ ] **Step 1: Change the frontend data test to require real data history**

In `check-production.mjs`, remove imports and tests for `parseCsv` and `normalizeRow`. Add this contract assertion:

```javascript
assert.throws(
  () => getForecastHistory("2099 Q1"),
  /Forecast history가 없습니다/
)
```

Add a test fixture import path only if needed; do not add a frontend test framework. Change the period assertion to read the existing synthetic history and assert each period matches `/^\d{2}-\d{2}월$/` instead of asserting fabricated future calendar dates. Add a one-point history assertion: every vendor delta is `null`, not zero.

- [ ] **Step 2: Run the current frontend check to confirm it still depends on the retired script**

Run:

```powershell
npm.cmd test
```

Working directory: `prototype/mi-dashboard-shadcn`.

Expected: FAIL after removing the retired imports because the data module has not yet enforced `dataMode`.

- [ ] **Step 3: Implement typed real/synthetic history selection and retire the bypass**

Set the checked-in mock `dashboard.json` to include `"dataMode": "synthetic"`. In `production.ts`, define:

```typescript
type DashboardData = {
  dataMode: "real" | "synthetic"
  asOf: string
  focusQuarter: string
  executiveSummary: string[]
  quarterlyProduction: QuarterlyProduction[]
  forecastHistory?: Record<string, ForecastHistoryPoint[]>
}

const typedDashboardData = dashboardData as DashboardData
```

Rename the current generated function to `getSyntheticForecastHistory`. Implement the public function exactly as follows:

```typescript
export function getForecastHistory(quarter: string): ForecastHistoryPoint[] {
  const exported = typedDashboardData.forecastHistory?.[quarter]
  if (exported?.length) return exported
  if (typedDashboardData.dataMode === "synthetic") {
    if (cumulativeProduction.some((item) => item.quarter === quarter)) {
      return getSyntheticForecastHistory(quarter)
    }
  }
  throw new Error(`Forecast history가 없습니다: ${quarter}`)
}
```

Change `getVendorHistoryDeltas` to return `null` for every vendor when `history.length < 2`; otherwise retain the latest-minus-previous calculation. In `cumulative-production-chart.tsx`, render `비교 가능한 이전 스냅샷 없음` in the forecast-history delta/legend area when all deltas are `null`, and render signed Mu values only when a vendor delta is non-null.

Retain existing vendor colors, chart layout, and public functions. Delete `scripts/update-dashboard-data.mjs`; remove `data:update` from `package.json`; set `data:check` to `node --experimental-strip-types scripts/check-production.mjs` so frontend data validation remains one command.

- [ ] **Step 4: Run frontend verification and build**

Run in `prototype/mi-dashboard-shadcn`:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Expected: all four commands pass and `site/data/v1` exists after a real-data export. The checked-in external mock continues to render as synthetic data without a network or CSV source.

- [ ] **Step 5: Commit the dashboard boundary**

```powershell
git add prototype/mi-dashboard-shadcn/src/data/dashboard.json prototype/mi-dashboard-shadcn/src/data/production.ts prototype/mi-dashboard-shadcn/src/components/cumulative-production-chart.tsx prototype/mi-dashboard-shadcn/scripts/check-production.mjs prototype/mi-dashboard-shadcn/package.json
git rm prototype/mi-dashboard-shadcn/scripts/update-dashboard-data.mjs
git commit -m "feat: read SigmaIntel forecast history from exports"
```

### Task 8: Make Pages verify the approved static artifacts and document the operating runbook

**Files:**
- Modify: `.github/workflows/pages.yml`
- Modify: `README.md`
- Modify: `prototype/mi-dashboard-shadcn/README.md`

**Interfaces:**
- Consumes: committed dashboard JSON and `public/data/v1` from Tasks 4–7.
- Produces: self-hosted Pages build that never ingests a source Excel or EDM data; its tests may create a temporary synthetic workbook, plus a user-facing Monday workflow.

- [ ] **Step 1: Write a failing workflow-content test in the existing Python suite**

Add this test to `tests/test_sigma_publish.py`:

```python
def test_pages_workflow_uses_internal_runner_and_never_updates_data_from_a_url(self) -> None:
    workflow = Path(".github/workflows/pages.yml").read_text(encoding="utf-8")
    self.assertIn("runs-on: [self-hosted, windows, x64]", workflow)
    self.assertNotIn("DASHBOARD_DATA_SOURCE", workflow)
    self.assertNotIn("data:update", workflow)
    self.assertIn("python -m unittest discover -s tests -p \"test_*.py\" -v", workflow)
    for path in ["scripts/sigma_pipeline.py", "scripts/update_sigmaintel.py", "tests/**", "requirements-data.txt", "대시보드 데이터 업데이트.bat", "README.md"]:
        self.assertIn(path, workflow)
```

- [ ] **Step 2: Run the workflow-content test to verify it fails**

Run:

```powershell
python -m unittest tests.test_sigma_publish.SigmaPublishTests.test_pages_workflow_uses_internal_runner_and_never_updates_data_from_a_url -v
```

Expected: FAIL because the current workflow accepts `data_source` and defaults to `ubuntu-latest`.

- [ ] **Step 3: Replace the workflow with static-artifact verification and self-hosted deployment**

Keep the existing required permissions, concurrency group, `configure-pages`, `upload-pages-artifact`, and `deploy-pages` actions. Remove `workflow_dispatch.inputs.data_source`, `workflow_dispatch.inputs.runner`, `DASHBOARD_DATA_SOURCE`, and the `Update dashboard data` step. Set both jobs to:

```yaml
runs-on: [self-hosted, windows, x64]
```

Extend the push `paths` list to include `.github/workflows/pages.yml`, `prototype/mi-dashboard-shadcn/**`, `scripts/sigma_pipeline.py`, `scripts/update_sigmaintel.py`, `tests/**`, `requirements-data.txt`, `대시보드 데이터 업데이트.bat`, `README.md`, and `edm.example.md`.

The build job steps, in this order, are checkout, setup Python 3.10, `python -m pip install -r requirements-data.txt`, setup Node 24 with the existing npm cache, `npm ci`, `python -m unittest discover -s tests -p "test_*.py" -v`, `npm run data:check && npm test && npm run lint && npm run build`, `configure-pages`, and `upload-pages-artifact` with `path: site`. Keep the Vite working directory on all npm steps. The deploy job contains only `actions/deploy-pages@v4` after the build job.

Document this runner precondition in both READMEs: the runner is a trusted internal Windows x64 machine with Python 3.10+, Node 24, Git, Excel desktop, and xlwings; run the runner in an interactive desktop session for the xlwings integration test because Office COM automation is not reliable from a non-interactive service. Actions never ingests a source Excel or EDM data; its test suite may create a temporary synthetic workbook locally. The local BAT is the only process that ingests Excel. Link to GitHub's [custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [self-hosted runner labels](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/use-in-a-workflow).

Replace the top-level data section with this exact operating sequence:

```text
1. 월요일에 SigmaIntel Excel을 input/에 넣는다.
2. 대시보드 데이터 업데이트.bat를 실행한다.
3. 보고서의 처리·중복·경고를 확인한다.
4. y를 입력한 경우에만 생성 JSON이 commit/push되고 Pages가 배포된다.
5. 성공한 원본은 archive/processed/에 남으며, 삭제는 사용자가 직접 결정한다.
```

- [ ] **Step 4: Run end-to-end local verification**

Run from repository root:

```powershell
python -m unittest discover -s tests -p "test_*.py" -v
git diff --check
```

Then run in `prototype/mi-dashboard-shadcn`:

```powershell
npm.cmd ci
npm.cmd run data:check
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: every command passes. Confirm `site/data/v1/manifest.json`, `site/data/v1/aggregates/production-quarterly.json`, and the dashboard home page build asset exist after a local real-data export. Confirm `git status --short` has no local DB, Excel, report, archive, or EDM file listed.

- [ ] **Step 5: Commit the deployable runbook**

```powershell
git add .github/workflows/pages.yml README.md prototype/mi-dashboard-shadcn/README.md tests/test_sigma_publish.py
git commit -m "docs: document SigmaIntel data deployment"
```

## Plan Self-Review

- **Spec coverage:** Tasks 1–2 implement xlwings-only 55-column Excel access and filename ordering. Task 3 provides savepoint-only local SQLite lineage, deduplication, conflicts, and reconciliation. Tasks 4–5 cover Actual-over-Forecast bars, Forecast-only history, tracked synthetic and internal real JSON, candidate DB/JSON promotion, EDM linkage, backfill, archive collision protection, and reports. Task 6 requires explicit approval, no-op suppression, and an exact internal-origin allowlist before any push. Task 7 changes the dashboard to exported real history while handling a one-snapshot history correctly. Task 8 enforces self-hosted static Pages verification and documents the runbook.
- **Deliberate minimality:** The implementation uses one pipeline module, one CLI module, stdlib `unittest`, and SQLite JSON fields for raw/spec preservation. It does not add pandas, openpyxl, a server, a task scheduler, a database ORM, or a second data-export implementation.
- **Placeholder scan:** The plan contains no unresolved implementation markers, deferred validation steps, or unspecified commands.
- **Type consistency:** `PlcRow`, `ImportResult`, `PipelineResult.generated_changed`, `read_plc_workbook`, `import_workbook`, `run_pipeline`, `export_json`, and `export_synthetic_contract` use the same names and return shapes across all tasks. The dashboard JSON's `dataMode`, `forecastHistory`, vendor keys, nullable one-snapshot deltas, and one-decimal volume convention are defined once and consumed unchanged.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-10-sigmaintel-excel-data-pipeline.md`.

1. **Subagent-Driven** - Dispatch a fresh subagent per task and review between tasks.
2. **Inline Execution (recommended for this project)** - Execute the tasks in this session using `superpowers:executing-plans`, with checkpoints after each commit.
