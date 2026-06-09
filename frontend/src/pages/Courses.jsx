// Courses.jsx — course list/add/delete, now backed by the database.
// CourseTable raises onDelete(name) (it doesn't know about ids), so here we
// look up the matching row's id and delete by id — keeping the component
// reusable and unchanged from 03.
import { useState, useEffect } from "react";
import CourseTable from "../components/CourseTable.jsx";
import { getCourses, addCourse, updateCourse, deleteCourse } from "../services/api.js";

const EMPTY = { name: "", trainer: "Suresh Rao", duration: "", status: "Upcoming" };

export default function Courses() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null); // course id being edited, or null = adding
  const [form, setForm] = useState(EMPTY);

  const load = () => getCourses().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleDelete = async (name) => {
    setError("");
    const course = rows.find((c) => c.name === name);
    if (!course) return;
    try { await deleteCourse(course.id); load(); }
    catch (e) { setError(e.message); }
  };

  // Load the chosen row into the form and switch into "edit" mode.
  const handleEdit = (course) => {
    setEditingId(course.id);
    setForm({ name: course.name, trainer: course.trainer, duration: course.duration, status: course.status });
  };

  const handleCancel = () => { setEditingId(null); setForm(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setError("");
    try {
      if (editingId) await updateCourse(editingId, form); // PUT — save changes
      else await addCourse(form);                         // POST — new course
      setEditingId(null);
      setForm(EMPTY);
      load();
    } catch (err) { setError(err.message); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {error && <p className="form-error">{error}</p>}

      <CourseTable rows={rows} onDelete={handleDelete} onEdit={handleEdit} />

      <div className="panel" style={{ marginTop: "1.5rem" }}>
        <h2>{editingId ? "Edit Course" : "Add Course"}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field"><label>Course Name</label>
            <input type="text" value={form.name} onChange={set("name")} /></div>
          <div className="field"><label>Trainer</label>
            <select value={form.trainer} onChange={set("trainer")}>
              <option>Suresh Rao</option><option>Anita Sharma</option><option>Priya Menon</option>
            </select>
          </div>
          <div className="field"><label>Duration</label>
            <input type="text" placeholder="e.g. 6 Weeks" value={form.duration} onChange={set("duration")} /></div>
          <div className="field"><label>Status</label>
            <select value={form.status} onChange={set("status")}>
              <option>Upcoming</option><option>Ongoing</option><option>Completed</option>
            </select>
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label>&nbsp;</label>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn" type="submit">{editingId ? "Save Changes" : "Add Course"}</button>
              {editingId && <button className="btn btn-secondary" type="button" onClick={handleCancel}>Cancel</button>}
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
