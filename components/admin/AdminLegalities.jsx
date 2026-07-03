"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Save, Plus, Trash2, Edit3, ChevronDown, ChevronUp } from "lucide-react";

const PAGES = ["privacy", "terms", "shipping", "returns"];
const LANGUAGES = ["en", "ar"];

export default function AdminLegalities() {
  const [selectedPage, setSelectedPage] = useState("privacy");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  
  const [policyData, setPolicyData] = useState({ sections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    fetchPolicy(selectedPage, selectedLanguage);
  }, [selectedPage, selectedLanguage]);

  const fetchPolicy = async (pageName, language) => {
    setIsLoading(true);
    setExpandedSection(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("legal_policies")
      .select("sections")
      .eq("page_name", pageName)
      .eq("language", language)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching policy:", error);
    }

    if (data && data.sections) {
      setPolicyData({ sections: data.sections });
    } else {
      setPolicyData({ sections: [] });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase
      .from("legal_policies")
      .upsert(
        { page_name: selectedPage, language: selectedLanguage, sections: policyData.sections },
        { onConflict: "page_name, language" }
      );

    if (error) {
      alert("Failed to save policy");
      console.error(error);
    } else {
      alert("Policy saved successfully!");
    }
    setIsSaving(false);
  };

  const addSection = () => {
    setPolicyData(prev => ({
      sections: [...prev.sections, { title: "New Topic", content: "<p>New content here...</p>" }]
    }));
    setExpandedSection(policyData.sections.length); // expand the new one
  };

  const updateSectionTitle = (idx, newTitle) => {
    setPolicyData(prev => {
      const newSections = [...prev.sections];
      newSections[idx].title = newTitle;
      return { sections: newSections };
    });
  };

  const updateSectionContent = (idx, newContent) => {
    setPolicyData(prev => {
      const newSections = [...prev.sections];
      newSections[idx].content = newContent;
      return { sections: newSections };
    });
  };

  const removeSection = (idx) => {
    if (confirm("Are you sure you want to delete this subtopic?")) {
      setPolicyData(prev => ({
        sections: prev.sections.filter((_, i) => i !== idx)
      }));
    }
  };

  const moveSection = (idx, dir) => {
    setPolicyData(prev => {
      const newSections = [...prev.sections];
      if (dir === 'up' && idx > 0) {
        [newSections[idx], newSections[idx - 1]] = [newSections[idx - 1], newSections[idx]];
      } else if (dir === 'down' && idx < newSections.length - 1) {
        [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
      }
      return { sections: newSections };
    });
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 className="admin-title">Legalities Management</h1>
        <button className="admin-btn" onClick={handleSave} disabled={isSaving || isLoading}>
          <Save size={14} style={{ marginRight: 8 }} />
          {isSaving ? "Saving..." : "Save Policies"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <label className="admin-label">Page</label>
          <select 
            className="admin-input" 
            value={selectedPage} 
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{ width: "200px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "#fff", color: "#111827", fontSize: "14px", fontWeight: "500", outline: "none", cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
          >
            {PAGES.map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="admin-label">Language</label>
          <select 
            className="admin-input" 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{ width: "150px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "#fff", color: "#111827", fontSize: "14px", fontWeight: "500", outline: "none", cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
          >
            {LANGUAGES.map(l => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="admin-muted">Loading policies...</p>
      ) : (
        <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          {policyData.sections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p className="admin-muted" style={{ marginBottom: "1rem" }}>No subtopics found for this page.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {policyData.sections.map((section, idx) => (
                <div key={idx} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
                  {/* Header Row */}
                  <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "#f1f5f9" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", color: "#6b7280" }}>
                        <Edit3 size={18} />
                      </div>
                      <input 
                        type="text" 
                        value={section.title}
                        onChange={(e) => updateSectionTitle(idx, e.target.value)}
                        className="admin-input"
                        style={{ margin: 0, padding: "6px 12px", width: "100%", maxWidth: "400px", fontWeight: "600", color: "#111", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "#fff" }}
                      />
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="admin-btn admin-btn--secondary" style={{ padding: "6px" }}><ChevronUp size={14}/></button>
                      <button onClick={() => moveSection(idx, 'down')} disabled={idx === policyData.sections.length - 1} className="admin-btn admin-btn--secondary" style={{ padding: "6px" }}><ChevronDown size={14}/></button>
                      <button onClick={() => removeSection(idx)} className="admin-btn admin-btn--danger" style={{ padding: "6px 12px", marginLeft: "8px" }}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Content Editor Always Visible */}
                  <div style={{ padding: "16px" }}>
                    <label className="admin-label">HTML Content</label>
                    <textarea 
                      className="admin-input"
                      value={section.content}
                      onChange={(e) => updateSectionContent(idx, e.target.value)}
                      style={{ minHeight: "200px", fontFamily: "monospace", fontSize: "13px", lineHeight: "1.5", color: "#111", width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "#fff" }}
                    />
                    <p className="admin-muted" style={{ fontSize: "11px", marginTop: "8px" }}>
                      Tip: You can use standard HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;a href="..."&gt;, and &lt;ul&gt; for formatting.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
            <button className="admin-btn admin-btn--secondary" onClick={addSection}>
              <Plus size={14} style={{ marginRight: 8 }} />
              Add New Subtopic
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
