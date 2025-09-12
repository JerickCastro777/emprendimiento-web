// FestivalSelect.tsx  (versión corregida)
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { specialDates } from "@/lib/special-dates";

type Props = {
  value?: string[];
  onChange?: (tags: string[]) => void;
  allowCustom?: boolean;
  className?: string;
};

function normalizeTag(raw: string) {
  if (!raw) return "";
  let s = raw.trim().toLowerCase();
  s = s.replace(/\s+/g, "-");
  if (!s.startsWith("#")) s = `#${s}`;
  return s;
}

function arraysEqual(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export default function FestivalSelect({
  value = [],
  onChange,
  allowCustom = true,
  className = "",
}: Props) {
  const [selected, setSelected] = useState<string[]>(value ?? []);
  const [customInput, setCustomInput] = useState("");

  const options = useMemo(
    () =>
      specialDates.map((d) => ({
        id: d.id,
        label: d.name,
        tag: `#${d.id}`,
      })),
    []
  );

  // si el padre cambia la prop value, sincronizamos el estado interno
  useEffect(() => {
    // solo actualizar si son distintos (evita bucles)
    if (!arraysEqual(value ?? [], selected)) {
      setSelected(value ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // notificamos al padre cuando selected cambie — y solo si difiere de value
  useEffect(() => {
    if (!onChange) return;
    if (!arraysEqual(value ?? [], selected)) {
      onChange(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, onChange, value]);

  // handlers — ya NO llaman onChange directamente
  function toggle(tag: string) {
    setSelected((s) => (s.includes(tag) ? s.filter((x) => x !== tag) : [...s, tag]));
  }

  function addCustom() {
    const t = normalizeTag(customInput);
    if (!t) return;
    setSelected((s) => {
      if (s.includes(t)) return s;
      return [...s, t];
    });
    setCustomInput("");
  }

  function removeTag(tag: string) {
    setSelected((s) => s.filter((t) => t !== tag));
  }

  return (
    <div className={className}>
      <div className="mb-2 text-sm">Festividades / Etiquetas</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
        {options.map((o) => {
          const active = selected.includes(o.tag);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.tag)}
              className={`text-left p-2 rounded border transition ${active ? "bg-purple-50 border-purple-300" : "bg-white border-gray-200 hover:shadow-sm"}`}
            >
              <div className="text-sm font-medium">{o.label}</div>
              <div className="text-xs text-gray-500 mt-1">{o.tag}</div>
            </button>
          );
        })}
      </div>

      {allowCustom && (
        <div className="flex items-center gap-2 mb-3">
          <input
            placeholder="Agregar etiqueta custom (ej: Kit romántico)"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button type="button" onClick={addCustom} className="px-3 py-2 bg-purple-600 text-white rounded">
            Añadir
          </button>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((t) => (
            <span key={t} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm">
              <span className="font-medium">{t}</span>
              <button type="button" onClick={() => removeTag(t)} className="text-xs text-red-600 hover:underline" aria-label={`Quitar ${t}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
