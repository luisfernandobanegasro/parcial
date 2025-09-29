// src/api/comunicacion.api.js
import { api } from "./api";

// CRUD avisos
const listAvisos = (params={}) => api.get("/comunicacion/avisos/", params);
const getAviso = (id) => api.get(`/comunicacion/avisos/${id}/`);
const createAviso = (payload) => api.post("/comunicacion/avisos/", payload);
const updateAviso = (id, payload) => api.patch(`/comunicacion/avisos/${id}/`, payload);
const deleteAviso = (id) => api.del(`/comunicacion/avisos/${id}/`);
const archivarAviso = (id) => api.patch(`/comunicacion/avisos/${id}/archivar/`, {});

// lecturas
const marcarVisto = (id) => api.post(`/comunicacion/avisos/${id}/marcar_visto/`, {});

// archivos
async function uploadArchivo(avisoId, file, nombre) {
  const path = `/comunicacion/avisos/${avisoId}/upload/`;
  // uso directo de axios con form-data mediante api.getBlob pattern simplificado
  const form = new FormData();
  form.append("file", file);
  if (nombre) form.append("nombre", nombre);
  const res = await fetch(`${api.API_BASE || ""}/api${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access") || ""}`,
    },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
const borrarArchivo = (avisoId, archivoId) => api.del(`/comunicacion/avisos/${avisoId}/archivos/${archivoId}/`);

export const ComunicacionAPI = {
  avisos: { list: listAvisos, get: getAviso, create: createAviso, update: updateAviso, remove: deleteAviso, archivar: archivarAviso },
  lecturas: { marcarVisto },
  archivos: { upload: uploadArchivo, remove: borrarArchivo },
};
export default ComunicacionAPI;
