"use client";
import { useState, useEffect, useCallback, ReactNode } from "react";

type Testimonial = { 
  _id: string; 
  name: string; 
  initials: string; 
  title: string; 
  quote: string; 
  rating: number; 
  isActive: boolean;
};

const CSS = `
  .card { background: #4A2C1D; border: 1px solid #7A4C36; border-radius: 12px; transition: border-color 0.18s; }
  .card:hover { border-color: #8E5A41; }
  .btn-primary { background: #F8F5F0; color: #4A2C1D; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .btn-primary:hover:not(:disabled) { background: #E67E22; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: #A89D8E; border: 1px solid #7A4C36; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; transition: all 0.15s; }
  .btn-ghost:hover { color: #E67E22; border-color: #E67E2240; }
  .btn-edit { background: transparent; color: #E6DFD3; border: 1px solid #E6DFD340; border-radius: 6px; padding: 5px 12px; font-size: 12px; cursor: pointer; }
  .btn-edit:hover { background: #E67E22; color: #FFF; border-color: #E67E22; }
  .input { background: #362015; border: 1px solid #7A4C36; border-radius: 8px; color: #F8F5F0; font-size: 13px; padding: 10px 14px; width: 100%; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
  .input:focus { border-color: #D1C9BE; }
  .overlay { position: fixed; inset: 0; background: #000000aa; display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
`;

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL;
  const token = () => localStorage.getItem("token") || "";

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch(`${api}/testimonial`);
      const data = await res.json();
      if (data.testimonials) setTestimonials(data.testimonials);
    } catch (e) { console.error(e); }
  }, [api]);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  const openAdd = () => {
    setEditId(null);
    setName("");
    setInitials("");
    setTitle("");
    setQuote("");
    setRating(5);
    setShowModal(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditId(t._id);
    setName(t.name);
    setInitials(t.initials);
    setTitle(t.title);
    setQuote(t.quote);
    setRating(t.rating);
    setShowModal(true);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${api}/testimonial/${id}/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token() },
        body: JSON.stringify({ testimonial: { isActive: !currentStatus } }),
      });
      const data = await res.json();
      if (data.success) {
        setTestimonials(prev => prev.map(t => t._id === id ? { ...t, isActive: !currentStatus } : t));
      }
    } catch (e) { console.error(e); }
  };

  const save = async () => {
    if (!name.trim() || !initials.trim() || !title.trim() || !quote.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const updatePayload = { name, initials, title, quote, rating };
        const res = await fetch(`${api}/testimonial/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: token() },
          body: JSON.stringify({ testimonial: updatePayload }),
        });
        const data = await res.json();
        if (data.success) {
          fetchTestimonials();
          setShowModal(false);
        } else {
          alert(data.error || "Failed to save.");
        }
      } else {
        const res = await fetch(`${api}/testimonial/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: token() },
          body: JSON.stringify({
            name,
            initials,
            title,
            quote,
            rating,
            isActive: true,
          }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchTestimonials();
          setShowModal(false);
        } else {
          alert(data.error || "Failed to save.");
        }
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      const res = await fetch(`${api}/testimonial/${id}`, {
        method: "DELETE",
        headers: { Authorization: token() },
      });
      const data = await res.json();
      if (data.success) setTestimonials(prev => prev.filter(t => t._id !== id));
      else alert(data.error || "Failed to delete.");
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ width: "100%" }}>
      <style>{CSS}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(20px,5vw,26px)", fontWeight: 800, color: "#F8F5F0", margin: 0 }}>
            Testimonials
          </h1>
          <p style={{ fontSize: 13, color: "#938575", margin: "4px 0 0 0" }}>{testimonials.length} total</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add New</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {testimonials.length === 0 && (
          <p style={{ color: "#938575", fontSize: 13 }}>No testimonials yet.</p>
        )}
        {testimonials.map(t => (
          <div key={t._id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F8F5F0", color: "#4A2C1D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14 }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#F8F5F0" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#A89D8E" }}>{t.title}</div>
                </div>
              </div>
              <button className="btn-ghost" onClick={() => remove(t._id)}>x</button>
            </div>
            
            <div style={{ marginTop: 12, fontSize: 12, color: "#C4A882" }}>
              {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
            </div>

            <p style={{ marginTop: 12, fontSize: 13, color: "#D1C9BE", lineHeight: 1.6, fontStyle: "italic" }}>
              "{t.quote}"
            </p>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #7A4C36", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button 
                className="btn-ghost" 
                style={{ color: t.isActive ? "#4ade80" : "#f87171", borderColor: t.isActive ? "#4ade8040" : "#f8717140" }}
                onClick={() => toggleActive(t._id, t.isActive)}
              >
                {t.isActive ? "Active" : "Inactive"}
              </button>
              <button className="btn-edit" onClick={() => openEdit(t)}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: "clamp(300px,90vw,500px)", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#F8F5F0", marginBottom: 20 }}>
              {editId ? "Edit Testimonial" : "New Testimonial"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel label="Full Name">
                    <input
                      className="input"
                      value={name}
                      placeholder="e.g. Amara Nwosu"
                      onChange={e => setName(e.target.value)}
                    />
                  </FieldLabel>
                </div>
                <div style={{ width: "100px" }}>
                  <FieldLabel label="Initials">
                    <input
                      className="input"
                      value={initials}
                      placeholder="e.g. AN"
                      maxLength={2}
                      onChange={e => setInitials(e.target.value)}
                    />
                  </FieldLabel>
                </div>
              </div>

              <FieldLabel label="Title / Company">
                <input
                  className="input"
                  value={title}
                  placeholder="e.g. Founder, Loom & Stone"
                  onChange={e => setTitle(e.target.value)}
                />
              </FieldLabel>

              <FieldLabel label="Quote">
                <textarea
                  className="input"
                  style={{ minHeight: 100, resize: "vertical" }}
                  value={quote}
                  placeholder="Testimonial text..."
                  onChange={e => setQuote(e.target.value)}
                />
              </FieldLabel>

              <FieldLabel label="Rating (1-5)">
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={e => setRating(Number(e.target.value))}
                />
              </FieldLabel>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : editId ? "Save Changes" : "Add Testimonial"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#A89D8E", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
