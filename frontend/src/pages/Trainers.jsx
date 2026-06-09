// Trainers.jsx — trainer list/add/delete, now backed by the database.
// (Adding/deleting trainers is admin-only on the backend.)
import { useState, useEffect } from "react";
import TrainerTable from "../components/TrainerTable.jsx";
import { getTrainers, addTrainer, updateTrainer, deleteTrainer } from "../services/api.js";

const EMPTY = { name: "", expertise: "", courses: "" };

export default function Trainers() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null); // login auto-made for the new trainer
  const [editingId, setEditingId] = useState(null); // trainer id being edited, or null = adding
  const [form, setForm] = useState(EMPTY);

  const load = () => getTrainers().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    setError("");
    try { await deleteTrainer(id); load(); }
    catch (e) { setError(e.message); }
  };

  // Load the chosen row into the form and switch into "edit" mode.
  const handleEdit = (trainer) => {
    setEditingId(trainer.id);
    setCreated(null);
    setForm({ name: trainer.name, expertise: trainer.expertise, courses: trainer.courses });
  };

  const handleCancel = () => { setEditingId(null); setForm(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setError("");
    try {
      if (editingId) {
        await updateTrainer(editingId, form); // PUT — save changes (no new login)
        setEditingId(null);
      } else {
        const res = await addTrainer(form);
        setCreated(res.login);
      }
      setForm(EMPTY);
      load();
    } catch (err) { setError(err.message); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="toolbar">
        <h2 style={{ fontSize: "1rem", color: "var(--color-muted)" }}>All Trainers</h2>
      </div>

      {error && <p className="form-error">{error}</p>}
      {created && (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <span className="badge badge-success">Login created</span>{" "}
          Username <b>{created.username}</b> · Password <b>{created.password}</b>
          <span className="muted-line"> — share these so the trainer can sign in.</span>
        </div>
      )}

      <TrainerTable rows={rows} onDelete={handleDelete} onEdit={handleEdit} />

      <div className="panel" style={{ marginTop: "1.5rem" }}>
        <h2>{editingId ? "Edit Trainer" : "Add Trainer"}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field"><label>Trainer Name</label>
            <input type="text" value={form.name} onChange={set("name")} /></div>
          <div className="field"><label>Expertise</label>
            <input type="text" value={form.expertise} onChange={set("expertise")} /></div>
          <div className="field"><label>Assigned Courses</label>
            <input type="text" value={form.courses} onChange={set("courses")} /></div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label>&nbsp;</label>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn" type="submit">{editingId ? "Save Changes" : "Add Trainer"}</button>
              {editingId && <button className="btn btn-secondary" type="button" onClick={handleCancel}>Cancel</button>}
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
