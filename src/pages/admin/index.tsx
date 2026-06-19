import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
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
  image: string;
  report: string;
}
interface Task2 {
  report: string;
}

const CREDENTIALS = { login: "2026SPRING", password: "paidOFF" };

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [task1List, setTask1List] = useState<Task1[]>([]);
  const [task1Image, setTask1Image] = useState("");
  const [task1Report, setTask1Report] = useState("");
  const [task1Error, setTask1Error] = useState("");
  const [task1Loading, setTask1Loading] = useState(false);

  const [task2List, setTask2List] = useState<Task2[]>([]);
  const [task2Report, setTask2Report] = useState("");
  const [task2Error, setTask2Error] = useState("");
  const [task2Loading, setTask2Loading] = useState(false);

  const { uploadImage, uploading } = useUpload();

  useEffect(() => {
    const savedLogin = localStorage.getItem("adminLoggedIn");
    if (savedLogin === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    if (
      loginInput === CREDENTIALS.login &&
      passwordInput === CREDENTIALS.password
    ) {
      setIsLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      setLoginError("");
    } else {
      setLoginError("Login yoki parol noto'g'ri!");
    }
  };

  const handleAddTask1 = async () => {
    if (!task1Image || !task1Report) {
      setTask1Error("Image va Report bo'sh bo'lmasligi kerak!");
      return;
    }
    try {
      setTask1Loading(true);
      setTask1Error("");
      const q = query(
        collection(db, "task1_reports"),
        where("report", "==", task1Report),
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        setTask1Error("Bu report allaqachon kiritilgan!");
        return;
      }
      await addDoc(collection(db, "task1_reports"), {
        image: task1Image,
        report: task1Report,
        createdAt: new Date(),
      });
      setTask1List([...task1List, { image: task1Image, report: task1Report }]);
      setTask1Image("");
      setTask1Report("");
    } catch (err) {
      setTask1Error("Xatolik yuz berdi.");
      console.error(err);
    } finally {
      setTask1Loading(false);
    }
  };

  const handleAddTask2 = async () => {
    if (!task2Report) {
      setTask2Error("Report bo'sh bo'lmasligi kerak!");
      return;
    }
    try {
      setTask2Loading(true);
      setTask2Error("");
      const q = query(
        collection(db, "task2_reports"),
        where("report", "==", task2Report),
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        setTask2Error("Bu report allaqachon kiritilgan!");
        return;
      }
      await addDoc(collection(db, "task2_reports"), {
        report: task2Report,
        createdAt: new Date(),
      });
      setTask2List([...task2List, { report: task2Report }]);
      setTask2Report("");
    } catch (err) {
      setTask2Error("Xatolik yuz berdi.");
      console.error(err);
    } finally {
      setTask2Loading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen text-black bg-gradient-to-b from-slate-100 via-white to-slate-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-8 py-10 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-2xl font-bold backdrop-blur-sm">
                W
              </div>
              <p className="text-xs uppercase tracking-[0.32em] text-sky-100/90 mb-3">
                Admin Access
              </p>
              <h1 className="text-3xl font-semibold">WriteReady Admin</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-sky-100/90">
                Manage exam prompts, upload Task 1 images, and keep your writing
                library fresh.
              </p>
            </div>

            <CardContent className="px-8 py-8 sm:px-10 flex flex-col gap-5">
              <div className="grid gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label>Login</Label>
                  <Input
                    placeholder="Login kiriting"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Parol</Label>
                  <Input
                    type="password"
                    placeholder="Parol kiriting"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
              </div>

              {loginError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loginError}
                </p>
              )}

              <Button
                onClick={handleLogin}
                className="w-full bg-sky-600 text-white hover:bg-sky-700 transition-all"
              >
                Kirish
              </Button>
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
              <p className="text-sm uppercase tracking-[0.3em] text-sky-600">
                Admin Dashboard
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                WriteReady Control Panel
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Quickly add new Task 1 images, upload Task 2 prompts, and keep
                your IELTS database organized.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoggedIn(false);
                localStorage.removeItem("adminLoggedIn");
              }}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Chiqish
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-sky-50 p-5 border border-sky-100">
              <p className="text-sm text-sky-600">Task 1 items</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {task1List.length}
              </p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5 border border-emerald-100">
              <p className="text-sm text-emerald-600">Task 2 items</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {task2List.length}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-5 border border-slate-200">
              <p className="text-sm text-slate-600">Total prompts</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {task1List.length + task2List.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="border-0 bg-sky-100 text-sky-700">
                    Task 1
                  </Badge>
                  <CardTitle className="text-xl">
                    Rasm + savol qo'shish
                  </CardTitle>
                </div>
                <p className="text-sm text-slate-500">
                  Upload image-based prompts for Task 1.
                </p>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-5 pt-5">
              <div className="flex flex-col gap-1.5">
                <Label>Rasm yuklash</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImage(file);
                      if (url) setTask1Image(url);
                    }
                  }}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-sky-600 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-sky-700"
                />
              </div>

              {uploading && (
                <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky-700 border-t-transparent" />
                  Yuklanmoqda...
                </div>
              )}

              {task1Image && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={task1Image}
                    alt="preview"
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label>Savol matni</Label>
                <Textarea
                  placeholder="Task 1 savol matnini kiriting..."
                  value={task1Report}
                  onChange={(e) => setTask1Report(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              {task1Error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {task1Error}
                </p>
              )}

              <Button
                onClick={handleAddTask1}
                disabled={task1Loading || uploading}
                className="bg-sky-600 text-white hover:bg-sky-700 transition-all"
              >
                {task1Loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saqlanmoqda...
                  </span>
                ) : (
                  "Qo'shish"
                )}
              </Button>

              {task1List.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Qo'shilgan Task 1 promptlar
                  </p>
                  <div className="space-y-3">
                    {task1List.map((t, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <img
                          src={t.image}
                          alt="task"
                          className="h-20 w-20 rounded-2xl object-cover"
                        />
                        <p className="text-sm text-slate-700 line-clamp-3">
                          {t.report}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="border-0 bg-emerald-100 text-emerald-700">
                    Task 2
                  </Badge>
                  <CardTitle className="text-xl">Savol qo'shish</CardTitle>
                </div>
                <p className="text-sm text-slate-500">
                  Add essay prompts for Task 2.
                </p>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-5 pt-5">
              <div className="flex flex-col gap-1.5">
                <Label>Savol matni</Label>
                <Textarea
                  placeholder="Task 2 savol matnini kiriting..."
                  value={task2Report}
                  onChange={(e) => setTask2Report(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              {task2Error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {task2Error}
                </p>
              )}

              <Button
                onClick={handleAddTask2}
                disabled={task2Loading}
                className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
              >
                {task2Loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saqlanmoqda...
                  </span>
                ) : (
                  "Qo'shish"
                )}
              </Button>

              {task2List.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Qo'shilgan Task 2 promptlar
                  </p>
                  <div className="space-y-3">
                    {task2List.map((t, i) => (
                      <div
                        key={i}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-sm text-slate-700">{t.report}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Admin; 