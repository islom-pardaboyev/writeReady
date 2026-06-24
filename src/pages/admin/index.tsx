import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import useUpload from "@/hooks/useUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Task1 {
  id: string;
  image: string;
  report: string;
}
interface Task2 {
  id: string;
  report: string;
}

const CREDENTIALS = { login: "2026SPRING", password: "paidOFF" };

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [task1List, setTask1List] = useState<Task1[]>([]);
  const [task1Search, setTask1Search] = useState("");
  const [task1Image, setTask1Image] = useState("");
  const [task1Report, setTask1Report] = useState("");
  const [task1Error, setTask1Error] = useState("");
  const [task1Loading, setTask1Loading] = useState(false);

  const [task2List, setTask2List] = useState<Task2[]>([]);
  const [task2Search, setTask2Search] = useState("");
  const [task2Report, setTask2Report] = useState("");
  const [task2Error, setTask2Error] = useState("");
  const [task2Loading, setTask2Loading] = useState(false);

  const [editingTask1, setEditingTask1] = useState<Task1 | null>(null);
  const [editingTask2, setEditingTask2] = useState<Task2 | null>(null);
  const [editImage, setEditImage] = useState("");
  const [editReport, setEditReport] = useState("");

  const { uploadImage, uploading } = useUpload();

  const filteredTask1 = task1List.filter((t) =>
    t.report.toLowerCase().includes(task1Search.toLowerCase())
  );
  const filteredTask2 = task2List.filter((t) =>
    t.report.toLowerCase().includes(task2Search.toLowerCase())
  );

  const loadData = async () => {
    try {
      const [t1Snap, t2Snap] = await Promise.all([
        getDocs(query(collection(db, "task1_reports"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "task2_reports"), orderBy("createdAt", "desc"))),
      ]);
      setTask1List(t1Snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task1, "id">) })));
      setTask2List(t2Snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task2, "id">) })));
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") === "true") setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const handleLogin = () => {
    if (loginInput === CREDENTIALS.login && passwordInput === CREDENTIALS.password) {
      setIsLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      setLoginError("");
    } else {
      setLoginError("Login yoki parol noto'g'ri!");
    }
  };

  const handleAddTask1 = async () => {
    if (!task1Image || !task1Report) { setTask1Error("Image va Report bo'sh bo'lmasligi kerak!"); return; }
    try {
      setTask1Loading(true); setTask1Error("");
      const q = query(collection(db, "task1_reports"), where("report", "==", task1Report));
      if (!(await getDocs(q)).empty) { setTask1Error("Bu report allaqachon kiritilgan!"); return; }
      const ref = await addDoc(collection(db, "task1_reports"), { image: task1Image, report: task1Report, createdAt: new Date() });
      setTask1List([{ id: ref.id, image: task1Image, report: task1Report }, ...task1List]);
      setTask1Image(""); setTask1Report("");
    } catch { setTask1Error("Xatolik yuz berdi."); } finally { setTask1Loading(false); }
  };

  const handleAddTask2 = async () => {
    if (!task2Report) { setTask2Error("Report bo'sh bo'lmasligi kerak!"); return; }
    try {
      setTask2Loading(true); setTask2Error("");
      const q = query(collection(db, "task2_reports"), where("report", "==", task2Report));
      if (!(await getDocs(q)).empty) { setTask2Error("Bu report allaqachon kiritilgan!"); return; }
      const ref = await addDoc(collection(db, "task2_reports"), { report: task2Report, createdAt: new Date() });
      setTask2List([{ id: ref.id, report: task2Report }, ...task2List]);
      setTask2Report("");
    } catch { setTask2Error("Xatolik yuz berdi."); } finally { setTask2Loading(false); }
  };

  const handleDeleteTask1 = async (id: string) => {
    if (!confirm("Bu Task 1 ni o'chirishni xohlaysizmi?")) return;
    await deleteDoc(doc(db, "task1_reports", id));
    setTask1List((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteTask2 = async (id: string) => {
    if (!confirm("Bu Task 2 ni o'chirishni xohlaysizmi?")) return;
    await deleteDoc(doc(db, "task2_reports", id));
    setTask2List((prev) => prev.filter((t) => t.id !== id));
  };

  const startEditTask1 = (t: Task1) => { setEditingTask1(t); setEditImage(t.image); setEditReport(t.report); };
  const startEditTask2 = (t: Task2) => { setEditingTask2(t); setEditReport(t.report); };

  const saveEditTask1 = async () => {
    if (!editingTask1 || !editImage || !editReport) return;
    await updateDoc(doc(db, "task1_reports", editingTask1.id), { image: editImage, report: editReport });
    setTask1List((prev) => prev.map((t) => t.id === editingTask1.id ? { ...t, image: editImage, report: editReport } : t));
    setEditingTask1(null);
  };

  const saveEditTask2 = async () => {
    if (!editingTask2 || !editReport) return;
    await updateDoc(doc(db, "task2_reports", editingTask2.id), { report: editReport });
    setTask2List((prev) => prev.map((t) => t.id === editingTask2.id ? { ...t, report: editReport } : t));
    setEditingTask2(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen text-black bg-gradient-to-b from-slate-100 via-white to-slate-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-8 py-10 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-2xl font-bold backdrop-blur-sm">W</div>
              <p className="text-xs uppercase tracking-[0.32em] text-sky-100/90 mb-3">Admin Access</p>
              <h1 className="text-3xl font-semibold">WriteReady Admin</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-sky-100/90">Manage exam prompts, upload Task 1 images, and keep your writing library fresh.</p>
            </div>
            <CardContent className="px-8 py-8 sm:px-10 flex flex-col gap-5">
              <div className="grid gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label>Login</Label>
                  <Input placeholder="Login kiriting" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Parol</Label>
                  <Input type="password" placeholder="Parol kiriting" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                </div>
              </div>
              {loginError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{loginError}</p>}
              <Button onClick={handleLogin} className="w-full bg-sky-600 text-white hover:bg-sky-700 transition-all">Kirish</Button>
            </CardContent>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-600">Admin Dashboard</p>
              <h1 className="text-3xl font-semibold text-slate-900">WriteReady Control Panel</h1>
              <p className="mt-2 text-sm text-slate-600">Add, edit, and delete Task 1 and Task 2 prompts.</p>
            </div>
            <Button variant="outline" onClick={() => { setIsLoggedIn(false); localStorage.removeItem("adminLoggedIn"); }} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">Chiqish</Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-sky-50 p-5 border border-sky-100">
              <p className="text-sm text-sky-600">Task 1 items</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{task1List.length}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5 border border-emerald-100">
              <p className="text-sm text-emerald-600">Task 2 items</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{task2List.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-5 border border-slate-200">
              <p className="text-sm text-slate-600">Total prompts</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{task1List.length + task2List.length}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge className="border-0 bg-sky-100 text-sky-700">Task 1</Badge>
                <CardTitle className="text-xl">Rasm + savol qo'shish</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-5 pt-5">
              <div className="flex flex-col gap-1.5">
                <Label>Rasm yuklash</Label>
                <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const url = await uploadImage(file); if (url) setTask1Image(url); } }}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-sky-600 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-sky-700" />
              </div>
              {uploading && <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700"><div className="h-3 w-3 animate-spin rounded-full border-2 border-sky-700 border-t-transparent" />Yuklanmoqda...</div>}
              {task1Image && <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-3"><img src={task1Image} alt="preview" className="h-40 w-full rounded-2xl object-cover" /></div>}
              <div className="flex flex-col gap-1.5">
                <Label>Savol matni</Label>
                <Textarea placeholder="Task 1 savol matnini kiriting..." value={task1Report} onChange={(e) => setTask1Report(e.target.value)} rows={5} className="resize-none" />
              </div>
              {task1Error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{task1Error}</p>}
              <Button onClick={handleAddTask1} disabled={task1Loading || uploading} className="bg-sky-600 text-white hover:bg-sky-700 transition-all">
                {task1Loading ? <span className="flex items-center gap-2"><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />Saqlanmoqda...</span> : "Qo'shish"}
              </Button>

              {task1List.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Task 1 promptlar ({filteredTask1.length}/{task1List.length})
                    </p>
                  </div>
                  <Input
                    placeholder="🔍 Search Task 1 prompts..."
                    value={task1Search}
                    onChange={(e) => setTask1Search(e.target.value)}
                  />
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {filteredTask1.length === 0
                      ? <p className="text-sm text-slate-400 text-center py-6">No results found.</p>
                      : filteredTask1.map((t) => (
                        <div key={t.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                          <img src={t.image} alt="task" className="h-36 w-full rounded-2xl object-cover" />
                          <p className="text-sm text-slate-700 line-clamp-3">{t.report}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 border-sky-200 text-sky-700 hover:bg-sky-50" onClick={() => startEditTask1(t)}>✏️ Edit</Button>
                            <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDeleteTask1(t.id)}>🗑 Delete</Button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge className="border-0 bg-emerald-100 text-emerald-700">Task 2</Badge>
                <CardTitle className="text-xl">Savol qo'shish</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-5 pt-5">
              <div className="flex flex-col gap-1.5">
                <Label>Savol matni</Label>
                <Textarea placeholder="Task 2 savol matnini kiriting..." value={task2Report} onChange={(e) => setTask2Report(e.target.value)} rows={5} className="resize-none" />
              </div>
              {task2Error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{task2Error}</p>}
              <Button onClick={handleAddTask2} disabled={task2Loading} className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all">
                {task2Loading ? <span className="flex items-center gap-2"><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />Saqlanmoqda...</span> : "Qo'shish"}
              </Button>

              {task2List.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Task 2 promptlar ({filteredTask2.length}/{task2List.length})
                    </p>
                  </div>
                  <Input
                    placeholder="🔍 Search Task 2 prompts..."
                    value={task2Search}
                    onChange={(e) => setTask2Search(e.target.value)}
                  />
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {filteredTask2.length === 0
                      ? <p className="text-sm text-slate-400 text-center py-6">No results found.</p>
                      : filteredTask2.map((t) => (
                        <div key={t.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                          <p className="text-sm text-slate-700">{t.report}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => startEditTask2(t)}>✏️ Edit</Button>
                            <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDeleteTask2(t.id)}>🗑 Delete</Button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingTask1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setEditingTask1(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900">Edit Task 1</h2>
            <img src={editImage} alt="current" className="h-36 w-full rounded-2xl object-cover" />
            <div className="flex flex-col gap-1.5">
              <Label>Replace Image (optional)</Label>
              <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const url = await uploadImage(file); if (url) setEditImage(url); } }}
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-sky-600 file:text-white file:font-semibold file:cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Savol matni</Label>
              <Textarea value={editReport} onChange={(e) => setEditReport(e.target.value)} rows={5} className="resize-none" />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-sky-600 text-white hover:bg-sky-700" onClick={saveEditTask1}>Save</Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditingTask1(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {editingTask2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setEditingTask2(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900">Edit Task 2</h2>
            <div className="flex flex-col gap-1.5">
              <Label>Savol matni</Label>
              <Textarea value={editReport} onChange={(e) => setEditReport(e.target.value)} rows={6} className="resize-none" />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700" onClick={saveEditTask2}>Save</Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditingTask2(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;