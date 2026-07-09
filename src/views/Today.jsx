import React, { useState } from "react";
import { C, btnStyle, inputStyle, sectionLabel, linkBtn } from "../theme.js";
import { uid, todayStr } from "../storage.js";
import { DepartureBoard, ArrivalsBoard } from "../components/boards.jsx";

export default function Today({ data, setData, onRemind }) {
  const [newTask, setNewTask] = useState("");
  const [newDue, setNewDue] = useState("");
  const [reqTask, setReqTask] = useState("");
  const [reqWho, setReqWho] = useState("");
  const [reqDue, setReqDue] = useState("");

  const toggleTodo = (id) => {
    const todos = data.todos.map((t) =>
      t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? todayStr() : null } : t,
    );
    setData({ ...data, todos });
  };

  const receiveRequest = (id) => {
    const requests = data.requests.map((r) =>
      r.id === id ? { ...r, done: !r.done, doneAt: !r.done ? todayStr() : null } : r,
    );
    setData({ ...data, requests });
  };

  const addTodo = () => {
    if (!newTask.trim()) return;
    setData({
      ...data,
      todos: [
        ...data.todos,
        { id: uid(), task: newTask.trim(), due: newDue || null, assignee: null, done: false, doneAt: null, recordId: null },
      ],
    });
    setNewTask("");
    setNewDue("");
  };

  const addRequest = () => {
    if (!reqTask.trim()) return;
    setData({
      ...data,
      requests: [
        ...data.requests,
        { id: uid(), task: reqTask.trim(), who: reqWho.trim() || "担当者", due: reqDue || null, done: false, doneAt: null, recordId: null },
      ],
    });
    setReqTask("");
    setReqWho("");
    setReqDue("");
  };

  const doneRecent = data.todos.filter((t) => t.done).slice(-5).reverse();

  return (
    <div>
      <DepartureBoard todos={data.todos} onToggle={toggleTodo} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="タスクを直接追加（臨時列車）"
          style={{ ...inputStyle, flex: 1 }}
        />
        <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
        <button onClick={addTodo} style={btnStyle}>追加</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <ArrivalsBoard requests={data.requests} onReceive={receiveRequest} onRemind={onRemind} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <input
          value={reqTask}
          onChange={(e) => setReqTask(e.target.value)}
          placeholder="依頼したこと（例：チラシ案の作成）"
          style={{ ...inputStyle, flex: 2, minWidth: 180 }}
        />
        <input
          value={reqWho}
          onChange={(e) => setReqWho(e.target.value)}
          placeholder="相手"
          style={{ ...inputStyle, flex: 1, minWidth: 80 }}
        />
        <input type="date" value={reqDue} onChange={(e) => setReqDue(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
        <button onClick={addRequest} style={btnStyle}>追加</button>
      </div>

      {doneRecent.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={sectionLabel}>発車済み（最近完了）</div>
          {doneRecent.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 2px", color: C.sub, fontSize: 13 }}>
              <span style={{ color: C.green }}>✓</span>
              <span style={{ textDecoration: "line-through", flex: 1 }}>{t.task}</span>
              <span style={{ fontSize: 11 }}>{t.doneAt}</span>
              <button onClick={() => toggleTodo(t.id)} style={linkBtn}>戻す</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
