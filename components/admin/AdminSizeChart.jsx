"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Save, Plus, Trash2 } from "lucide-react";

export default function AdminSizeChart() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data, error } = await supabase.from('product_categories').select('name').order('position', { ascending: true });
      if (data && data.length > 0) {
        const catNames = data.map(c => c.name);
        setCategories(catNames);
        if (!selectedCategory) {
          setSelectedCategory(catNames[0]);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSizeChart(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchSizeChart = async (category) => {
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("size_charts")
      .select("chart_data")
      .eq("category", category)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching size chart:", error);
    }

    if (data && data.chart_data) {
      setChartData(data.chart_data);
    } else {
      // Default empty structure
      setChartData({
        columns: ["Size", "S", "M", "L", "XL"],
        rows: [
          { label: "Chest", values: ["", "", "", ""] },
          { label: "Length", values: ["", "", "", ""] }
        ]
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase
      .from("size_charts")
      .upsert(
        { category: selectedCategory, chart_data: chartData },
        { onConflict: "category" }
      );

    if (error) {
      alert("Failed to save size chart");
      console.error(error);
    } else {
      alert("Size chart saved successfully!");
    }
    setIsSaving(false);
  };

  const addColumn = () => {
    setChartData(prev => {
      const newCols = [...prev.columns, "New Size"];
      const newRows = prev.rows.map(row => ({
        ...row,
        values: [...row.values, ""]
      }));
      return { columns: newCols, rows: newRows };
    });
  };

  const removeColumn = (idx) => {
    if (idx === 0) return; // Can't remove the 'Size' label column
    setChartData(prev => {
      const newCols = prev.columns.filter((_, i) => i !== idx);
      const newRows = prev.rows.map(row => ({
        ...row,
        values: row.values.filter((_, i) => i !== idx - 1)
      }));
      return { columns: newCols, rows: newRows };
    });
  };

  const addRow = () => {
    setChartData(prev => {
      const newRow = { label: "New Measurement", values: Array(prev.columns.length - 1).fill("") };
      return { ...prev, rows: [...prev.rows, newRow] };
    });
  };

  const removeRow = (idx) => {
    setChartData(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== idx)
    }));
  };

  const updateColumnHeader = (idx, value) => {
    setChartData(prev => {
      const newCols = [...prev.columns];
      newCols[idx] = value;
      return { ...prev, columns: newCols };
    });
  };

  const updateRowLabel = (idx, value) => {
    setChartData(prev => {
      const newRows = [...prev.rows];
      newRows[idx] = { ...newRows[idx], label: value };
      return { ...prev, rows: newRows };
    });
  };

  const updateCellValue = (rowIndex, colIndex, value) => {
    setChartData(prev => {
      const newRows = [...prev.rows];
      const newValues = [...newRows[rowIndex].values];
      newValues[colIndex] = value;
      newRows[rowIndex] = { ...newRows[rowIndex], values: newValues };
      return { ...prev, rows: newRows };
    });
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 className="admin-title">Size Chart Management</h1>
        <button className="admin-btn" onClick={handleSave} disabled={isSaving || isLoading}>
          <Save size={14} style={{ marginRight: 8 }} />
          {isSaving ? "Saving..." : "Save Chart"}
        </button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <label className="admin-label">Select Category</label>
        <select 
          className="admin-input" 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ maxWidth: "300px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "#fff", color: "#111827", fontSize: "14px", fontWeight: "500", outline: "none", cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {isLoading && !selectedCategory ? (
        <p className="admin-muted">Loading chart data...</p>
      ) : categories.length === 0 ? (
        <div style={{ padding: "20px", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", border: "1px solid #fecaca" }}>
          No categories found. Please ensure the <strong>product_categories</strong> table has data and Row Level Security (RLS) is disabled or allows public read access.
        </div>
      ) : chartData && (
        <div style={{ overflowX: "auto", background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                {chartData.columns.map((col, idx) => (
                  <th key={idx} style={{ padding: "12px", borderBottom: "2px solid #ddd", minWidth: "120px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input 
                        type="text" 
                        value={col} 
                        onChange={(e) => updateColumnHeader(idx, e.target.value)}
                        className="admin-input"
                        style={{ padding: "8px 12px", margin: 0, fontWeight: "600", color: "#111827", backgroundColor: "#f9fafb", border: "1px solid #d1d5db", borderRadius: "6px" }}
                        disabled={idx === 0}
                      />
                      {idx !== 0 && (
                        <button onClick={() => removeColumn(idx)} style={{ color: "#ef4444", cursor: "pointer", background: "none", border: "none" }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>
                  <button className="admin-btn admin-btn--secondary" onClick={addColumn} style={{ padding: "4px 8px" }}>
                    <Plus size={14} /> Col
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {chartData.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input 
                        type="text" 
                        value={row.label} 
                        onChange={(e) => updateRowLabel(rowIdx, e.target.value)}
                        className="admin-input"
                        style={{ padding: "8px 12px", margin: 0, fontWeight: "500", color: "#111827", backgroundColor: "#f9fafb", border: "1px solid #d1d5db", borderRadius: "6px" }}
                      />
                    </div>
                  </td>
                  {row.values.map((val, colIdx) => (
                    <td key={colIdx} style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                      <input 
                        type="text" 
                        value={val} 
                        onChange={(e) => updateCellValue(rowIdx, colIdx, e.target.value)}
                        className="admin-input"
                        style={{ padding: "8px 12px", margin: 0, color: "#111827", backgroundColor: "#fff", border: "1px solid #d1d5db", borderRadius: "6px", width: "100%" }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                    <button onClick={() => removeRow(rowIdx)} style={{ color: "#ef4444", cursor: "pointer", background: "none", border: "none" }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={chartData.columns.length + 1} style={{ padding: "12px" }}>
                   <button className="admin-btn admin-btn--secondary" onClick={addRow} style={{ padding: "4px 12px" }}>
                    <Plus size={14} style={{ marginRight: 6 }} /> Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
