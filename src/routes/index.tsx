import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { daysLeft, progress, todayStr, uid, type Subject, type Task } from "@/lib/planner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planer Nauki do Sesji" },
      { name: "description", content: "Organizuj naukę do egzaminów: odliczanie D-Day, postęp materiału i dzienny harmonogram." },
      { property: "og:title", content: "Planer Nauki do Sesji" },
      { property: "og:description", content: "Odliczanie do egzaminów, postęp materiału i plan dnia w jednym miejscu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function useStored<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setVal(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (loaded) localStorage.setItem(key, JSON.stringify(val));
  }, [key, val, loaded]);
  return [val, setVal] as const;
}

const input = "w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring";
const btn = "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition";

function Index() {
  const [subjects, setSubjects] = useStored<Subject[]>("planer.subjects", []);
  const [tasks, setTasks] = useStored<Task[]>("planer.tasks", []);
  const [sort, setSort] = useStored<"date" | "alpha">("planer.sort", "date");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const addSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    setSubjects([...subjects, { id: uid(), name: name.trim(), examDate: date, topics: [] }]);
    setName(""); setDate("");
  };
  const update = (id: string, fn: (s: Subject) => Subject) =>
    setSubjects(subjects.map((s) => (s.id === id ? fn(s) : s)));

  const sorted = [...subjects].sort((a, b) =>
    sort === "alpha" ? a.name.localeCompare(b.name, "pl") : a.examDate.localeCompare(b.examDate)
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-widest text-primary">Sesja</p>
          <h1 className="text-4xl font-bold">Planer Nauki do Sesji</h1>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <section>
            <form onSubmit={addSubject} className="mb-6 flex flex-col gap-2 rounded-xl border border-surface-border bg-surface p-4 sm:flex-row">
              <input className={input} placeholder="Nazwa przedmiotu" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={`${input} sm:w-44`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <button className={btn}>Dodaj</button>
            </form>
            {sorted.length > 0 && (
              <div className="mb-4 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Sortuj:</span>
                {([["date", "Najbliższy termin"], ["alpha", "Alfabetycznie"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setSort(key)}
                    className={`rounded-full px-3 py-1 font-medium transition ${sort === key ? "bg-primary text-primary-foreground" : "border border-surface-border bg-surface text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {sorted.length === 0 && <p className="text-muted-foreground">Dodaj pierwszy przedmiot, aby zacząć odliczanie.</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {sorted.map((s) => <SubjectCard key={s.id} s={s} update={update} remove={() => setSubjects(subjects.filter((x) => x.id !== s.id))} />)}
            </div>
          </section>
          <Schedule tasks={tasks} setTasks={setTasks} />
        </div>
      </div>
    </div>
  );
}

function SubjectCard({ s, update, remove }: { s: Subject; update: (id: string, fn: (s: Subject) => Subject) => void; remove: () => void }) {
  const [topic, setTopic] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState("");
  const d = daysLeft(s.examDate);
  const p = progress(s.topics);
  const tone = d < 0 ? "bg-muted text-muted-foreground" : d <= 3 ? "bg-destructive text-destructive-foreground" : d <= 7 ? "bg-warning text-card-foreground" : "bg-card-foreground text-card";
  const label = d < 0 ? "Po egzaminie" : d === 0 ? "Dziś!" : `D-${d}`;
  return (
    <article className="rounded-xl bg-card p-5 text-card-foreground shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{s.name}</h2>
          {editingDate ? (
            <form
              className="mt-1 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (dateDraft) update(s.id, (x) => ({ ...x, examDate: dateDraft }));
                setEditingDate(false);
              }}
            >
              <input type="date" className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-[var(--success)] outline-none focus:ring-2 focus:ring-ring [color-scheme:dark]" value={dateDraft} onChange={(e) => setDateDraft(e.target.value)} autoFocus />
              <button type="submit" className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90">Zapisz</button>
              <button type="button" className="text-xs text-muted-foreground hover:text-card-foreground" onClick={() => setEditingDate(false)}>Anuluj</button>
            </form>
          ) : (
            <button className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-card-foreground" aria-label="Zmień datę egzaminu" onClick={() => { setDateDraft(s.examDate); setEditingDate(true); }}>
              Egzamin: {new Date(s.examDate).toLocaleDateString("pl-PL")}
            </button>
          )}
        </div>
        <span className={`rounded-full px-3 py-1 font-display text-sm font-bold ${tone}`}>{label}</span>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-medium"><span>Opanowany materiał</span><span>{p}%</span></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${p}%` }} />
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {s.topics.map((t) => (
          <li key={t.id} className="group flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-[var(--success)]" checked={t.done}
              onChange={() => update(s.id, (x) => ({ ...x, topics: x.topics.map((y) => (y.id === t.id ? { ...y, done: !y.done } : y)) }))} />
            <span className={`flex-1 ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
            <button className="text-muted-foreground opacity-0 group-hover:opacity-100" aria-label="Usuń zagadnienie"
              onClick={() => update(s.id, (x) => ({ ...x, topics: x.topics.filter((y) => y.id !== t.id) }))}>×</button>
          </li>
        ))}
      </ul>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!topic.trim()) return;
        update(s.id, (x) => ({ ...x, topics: [...x.topics, { id: uid(), title: topic.trim(), done: false }] })); setTopic(""); }}>
        <input className="flex-1 rounded-lg border border-input bg-background/0 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Nowe zagadnienie" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <button className="rounded-lg bg-card-foreground px-3 text-sm font-semibold text-card">+</button>
      </form>
      <button onClick={remove} className="mt-3 text-xs text-muted-foreground hover:text-destructive">Usuń przedmiot</button>
    </article>
  );
}

function Schedule({ tasks, setTasks }: { tasks: Task[]; setTasks: (t: Task[]) => void }) {
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  useEffect(() => setDay(todayStr()), []);
  const list = tasks.filter((t) => t.date === day).sort((a, b) => a.time.localeCompare(b.time));
  return (
    <aside className="h-fit rounded-xl border border-surface-border bg-surface p-5">
      <h2 className="mb-3 text-xl font-bold">Plan dnia</h2>
      <input type="date" className={`${input} [color-scheme:dark]`} value={day} onChange={(e) => setDay(e.target.value)} />
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!title.trim() || !day) return;
        setTasks([...tasks, { id: uid(), date: day, time, title: title.trim(), done: false }]); setTitle(""); setTime(""); }}>
        <input type="time" className={`${input} w-28 [color-scheme:dark]`} value={time} onChange={(e) => setTime(e.target.value)} />
        <input className={input} placeholder="Co uczysz?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className={btn}>+</button>
      </form>
      <ul className="mt-4 space-y-2">
        {list.length === 0 && <li className="text-sm text-muted-foreground">Brak zaplanowanych bloków.</li>}
        {list.map((t) => (
          <li key={t.id} className="group flex items-center gap-3 rounded-lg bg-background px-3 py-2 text-sm">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={t.done}
              onChange={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
            <span className="w-12 font-display text-primary">{t.time || "—"}</span>
            <span className={`flex-1 ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
            <button className="text-muted-foreground opacity-0 group-hover:opacity-100" aria-label="Usuń"
              onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}>×</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
