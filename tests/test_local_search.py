import importlib.util
from pathlib import Path

import pytest

MODULE = (
    Path(__file__).resolve().parents[1]
    / "skills/vchart-skill/scripts/search_knowledge.py"
)
spec = importlib.util.spec_from_file_location("local_search", MODULE)
search_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(search_module)


def test_search_ranks_title_matches_and_returns_portable_paths(tmp_path):
    directory = tmp_path / "references/examples"
    directory.mkdir(parents=True)
    (directory / "bar.md").write_text("# 柱状图 bar\n字段映射", encoding="utf-8")
    (directory / "other.md").write_text("# 其他\n柱状图 bar", encoding="utf-8")
    result = search_module.search(tmp_path, "examples", "柱状图 bar", 1)
    assert [item["path"] for item in result] == ["references/examples/bar.md"]


def test_search_does_not_return_unrelated_documents(tmp_path):
    directory = tmp_path / "references/components"
    for name in ("components", "chart", "api"):
        (tmp_path / "references" / name).mkdir(parents=True)
    (directory / "legend.md").write_text("# legend\ncolor", encoding="utf-8")
    assert search_module.search(tmp_path, "sops", "tooltip", 3) == []


def test_missing_resources_fail_instead_of_looking_elsewhere(tmp_path):
    with pytest.raises(FileNotFoundError, match="Missing bundled"):
        search_module.search(tmp_path, "examples", "bar", 1)


@pytest.mark.parametrize("kind,query", [("examples", "bar"), ("sops", "tooltip")])
def test_installed_resources_are_searchable(kind, query):
    root = MODULE.parents[1]
    results = search_module.search(root, kind, query, 3)
    assert results
    assert all((root / item["path"]).is_file() for item in results)


def test_diagnostic_search_uses_canonical_component_chart_and_api_references(tmp_path):
    for name in ("components", "chart", "api"):
        directory = tmp_path / "references" / name
        directory.mkdir(parents=True)
        (directory / "tooltip.md").write_text("# tooltip\nDetails", encoding="utf-8")
    results = search_module.search(tmp_path, "sops", "tooltip", 10)
    assert {item["path"] for item in results} == {
        f"references/{name}/tooltip.md" for name in ("components", "chart", "api")
    }
