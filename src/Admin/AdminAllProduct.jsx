import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

import { AdminAuthContext } from "@/context/AdminAuthContext.jsx";
import { useContext } from "react";

import { Skeleton } from "@/components/ui/skeleton.jsx";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";




import { Button } from "@/components/ui/button";
import { Title } from "@radix-ui/react-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input.jsx";
import { Loader2, X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner"; // ✅ import toast

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";


// ✅ Fallback image
import DEFAULT_VARIANT_IMG from "../Images/Default-Variant-Image.jpg";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";

export const AdminAllProduct = () => {



  const { admin } = useContext(AdminAuthContext);

  const API_BASE = import.meta.env.VITE_SERVER_URL?.replace(/\/+$/, "") || "";

  const UPLOADS_BASE = `${API_BASE}/uploads`;

  const [products, setProducts] = useState([]);
  const [loadingProd, setLoadingProd] = useState(true);

  const loadProducts = async () => {
    try {
      setLoadingProd(true);
      const res = await api.get("/admin/manage-products/fetch");
      setProducts(res.data?.data || []);
      console.log("Products loaded");
    } catch (error) {
      console.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoadingProd(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const toImageURL = (img) => {
    if (!img) return "";
    const raw =
      img.storage_key ??
      img.storageKey ??
      img.path ??
      img.url ??
      img.image_url ??
      "";

    if (!raw) return "";
    const isAbsolute = /^https?:\/\//i.test(raw) || raw.startsWith("data:");
    return isAbsolute ? raw : `${UPLOADS_BASE}/${raw}`.replace(/([^:]\/)\/+/g, "$1");
  };


  // Flatten variants out of products for the second table
  const variantRows = useMemo(() => {
    return (products || []).flatMap((p) => {
      const list = Array.isArray(p.variants) ? p.variants : [];
      return list.map((v) => {
        const imgs = Array.isArray(v.images) ? v.images : [];
        const mainImg = imgs.find((i) => i?.is_main) || imgs[0] || null;

        const variantLabel = Array.isArray(v.option_values)
          ? v.option_values.map((ov) => ov?.value_name).filter(Boolean).join(" / ")
          : "—";

        return {
          productId: p.id,
          productName: p.name,
          id: v.id,
          sku: v.sku,
          variantLabel,
          price: v.price,
          compareAt: v.compare_at,
          costPerItem: v.cost_per_item,
          stock: v.stock,
          scarcityStock: v.scarcity_stock ?? 0,
          batchNo: v.batch_number ?? 1,
          isActive: !!v.is_active,
          createdAt: v.created_at || p.created_at,

          // 👇 use this in the table
          imageUrl: toImageURL(mainImg),

          images: imgs,
          supplierId: v.supplier_id ?? "",
          shipmentId: v.shipment_id ?? "",
          raw: v,
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // selected values
  const [categories, setCategories] = useState([]); // [{id, name}, ...]
  const [category, setCategory] = useState(""); // selected category id (string)
  // const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/admin/manage-products/categories");
        // server returns [{id, name}], map to names for your current state shape
        setCategories(res.data);
      } catch (err) {
        toast.error("Failed to load categories");
        console.error(err);
      }
    };
    loadCategories();
  }, []);


  const [types, setTypes] = useState([]); // [{id, name}, ...]
  const [type, setType] = useState("");
  const [newType, setNewType] = useState("");
  const [typeAddLoading, setTypeAddLoading] = useState(false);
  const [typeDeletingId, setTypeDeletingId] = useState(null);

  useEffect(() => {
    const LoadTypes = async () => {
      try {
        const res = await api.get("/admin/manage-products/types");
        // server returns [{id, name}], map to names for your current state shape
        setTypes(res.data);
      } catch (err) {
        toast.error("Failed to load types");
        console.error(err);
      }
    };
    LoadTypes();
  }, []);

  const saveTypeToDb = async (name) => {
    try {
      const res = await api.post("/admin/manage-products/types", { name });
      return res.data.type; // {id, name}
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Type already exists");
      } else {
        toast.error(err.response?.data?.error || "❌ Failed to add type");
      }
      return false;
    }
  };

  const addType = async () => {
    const v = newType.trim();
    if (!v || typeAddLoading) return;

    // client-side case-insensitive check
    const existsLocal = types.some(
      (c) => c.name.toLowerCase() === v.toLowerCase()
    );
    if (existsLocal) {
      toast.error("Type already exists");
      return;
    }

    setTypeAddLoading(true);
    try {
      const created = await saveTypeToDb(v); // {id, name} or null
      if (created) {
        setTypes((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setType(String(created.id));
        toast.success("Type added");
      }
      setNewType("");
    } finally {
      setTypeAddLoading(false);
    }
  };

  const deleteType = async (id) => {
    setTypeDeletingId(id);
    try {
      const res = await api.delete(`/admin/manage-products/types/${id}`);
      toast.success(res.data.message);
      setTypes((prev) => prev.filter((c) => String(c.id) !== String(id)));
      setType((sel) => (String(sel) === String(id) ? "" : sel));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete type");
    } finally {
      setTypeDeletingId(null);
    }
  };

  const [materials, setMaterials] = useState([]); // [{id, name}, ...]
  const [material, setMaterial] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [materialAddLoading, setMaterialAddLoading] = useState(false);
  const [materialDeletingId, setMaterialDeletingId] = useState(null);


  useEffect(() => {
    const LoadMaterials = async () => {
      try {
        const res = await api.get("/admin/manage-products/materials");
        // server returns [{id, name}], map to names for your current state shape
        setMaterials(res.data);
      } catch (err) {
        toast.error("Failed to load materials");
        console.error(err);
      }
    };
    LoadMaterials();
  }, []);

  const saveMaterialToDb = async (name) => {
    try {
      const res = await api.post("/admin/manage-products/materials", { name });
      return res.data.material; // {id, name}
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Material already exists");
      } else {
        toast.error(err.response?.data?.error || "❌ Failed to add material");
      }
      return false;
    }
  };

  const addMaterial = async () => {
    const v = newMaterial.trim();
    if (!v || materialAddLoading) return;

    const existsLocal = materials.some(
      (c) => c.name.toLowerCase() === v.toLowerCase()
    );
    if (existsLocal) {
      toast.error("Material already exists");
      return;
    }

    setMaterialAddLoading(true);
    try {
      const created = await saveMaterialToDb(v);
      if (created) {
        setMaterials((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setMaterial(String(created.id));
        toast.success("Material added");
      }
      setNewMaterial("");
    } finally {
      setMaterialAddLoading(false);
    }
  };

  const deleteMaterial = async (id) => {
    setMaterialDeletingId(id);
    try {
      const res = await api.delete(`/admin/manage-products/materials/${id}`);
      toast.success(res.data.message);
      setMaterials((prev) => prev.filter((c) => String(c.id) !== String(id)));
      setMaterial((sel) => (String(sel) === String(id) ? "" : sel));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete material");
    } finally {
      setMaterialDeletingId(null);
    }
  };

  const [tags, setTags] = useState([]); // [{id, name}]
  const [selectedTags, setSelectedTags] = useState([]); // array of string ids
  const [newTag, setNewTag] = useState("");

  const [tagsOpen, setTagsOpen] = useState(false); // for tags popover
  const [tagAddLoading, setTagAddLoading] = useState(false);
  const [tagDeletingId, setTagDeletingId] = useState(null);


  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await api.get("/admin/manage-products/tags"); // expects [{id,name}]
        setTags(res.data);
      } catch (err) {
        toast.error("Failed to load tags");
        console.error(err);
      }
    };
    loadTags();
  }, []);

  const saveTagToDb = async (name) => {
    try {
      const res = await api.post("/admin/manage-products/tags", { name });
      return res.data.tag; // {id, name}
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Tag already exists");
      } else {
        toast.error(err.response?.data?.error || "❌ Failed to add tag");
      }
      return false;
    }
  };

  const addTag = async () => {
    const v = newTag.trim();
    if (!v || tagAddLoading) return;

    const existsLocal = tags.some(
      (t) => t.name.toLowerCase() === v.toLowerCase()
    );
    if (existsLocal) {
      toast.error("Tag already exists");
      return;
    }

    setTagAddLoading(true);
    try {
      const created = await saveTagToDb(v);
      if (created) {
        setTags((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setSelectedTags((prev) => [...new Set([...prev, String(created.id)])]);
        toast.success("Tag added");
      }
      setNewTag("");
    } finally {
      setTagAddLoading(false);
    }
  };

  const deleteTag = async (id) => {
    setTagDeletingId(id);
    try {
      const res = await api.delete(`/admin/manage-products/tags/${id}`);
      toast.success(res.data.message);
      setTags((prev) => prev.filter((t) => String(t.id) !== String(id)));
      setSelectedTags((prev) => prev.filter((tid) => String(tid) !== String(id)));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete tag");
    } finally {
      setTagDeletingId(null);
    }
  };

  // --- toggle select multiple tags
  const toggleTag = (id) => {
    console.log("Toggle called:", id); // DEBUG
    setSelectedTags((prev) => {
      const key = String(id);
      return prev.includes(key)
        ? prev.filter((x) => x !== key)
        : [...prev, key];
    });
  };;

  const [descriptions, setDescriptions] = useState([]); // [{id, title, body}]
  const [descriptionTitle, setDescriptionTitle] = useState("");
  const [descriptionBody, setDescriptionBody] = useState(""); // the editable
  // textarea
  const [selectedDescriptionId, setSelectedDescriptionId] = useState(""); // dropdown selection
  const [editingDescriptionId, setEditingDescriptionId] = useState(""); // "" = adding, otherwise editing this id
  const [descAddLoading, setDescAddLoading] = useState(false);
  const [descUpdateLoading, setDescUpdateLoading] = useState(false);
  const [descDeletingId, setDescDeletingId] = useState(null);

  const startEditingDescription = (item) => {
    setEditingDescriptionId(String(item.id));
    setSelectedDescriptionId(String(item.id));
    setDescriptionTitle(item.title);
    setDescriptionBody(item.body);
  };

  const cancelEditingDescription = () => {
    setEditingDescriptionId("");
    setDescriptionTitle("");
    setDescriptionBody("");
  };

  useEffect(() => {
    const loadDescriptions = async () => {
      try {
        const res = await api.get("/admin/manage-products/descriptions"); // [{id,title,body}]
        setDescriptions(res.data);
      } catch (err) {
        toast.error("Failed to load descriptions");
        console.error(err);
      }
    };
    loadDescriptions();
  }, []);

  const updateDescriptionToDb = async (id, { title, body }) => {
    try {
      const res = await api.patch(`/admin/manage-products/descriptions/${id}`, {
        title,
        body,
      });
      return res.data.description; // {id,title,body}
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("A description with this title already exists");
      } else {
        toast.error(
          err.response?.data?.error || "❌ Failed to update description"
        );
      }
      return false;
    }
  };

  const updateDescription = async () => {
    const t = descriptionTitle.trim();
    const b = descriptionBody.trim();
    if (!editingDescriptionId) return;
    if (!t) return toast.error("Title is required");
    if (!b) return toast.error("Description is required");
    if (descUpdateLoading) return;

    setDescUpdateLoading(true);
    try {
      const updated = await updateDescriptionToDb(editingDescriptionId, { title: t, body: b });
      if (updated) {
        setDescriptions((prev) =>
          prev
            .map((d) => (String(d.id) === String(updated.id) ? updated : d))
            .sort((a, b) => a.title.localeCompare(b.title))
        );
        setSelectedDescriptionId(String(updated.id));
        setEditingDescriptionId("");
        setDescriptionTitle("");
        setDescriptionBody("");
        toast.success("Description updated");
      }
    } finally {
      setDescUpdateLoading(false);
    }
  };

  const saveDescriptionToDb = async ({ title, body }) => {
    try {
      const res = await api.post("/admin/manage-products/descriptions", {
        title,
        body,
      });
      return res.data.description; // {id,title,body}
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("A description with this title already exists");
      } else {
        toast.error(
          err.response?.data?.error || "❌ Failed to add description"
        );
      }
      return false;
    }
  };

  const addDescription = async () => {
    const t = descriptionTitle.trim();
    const b = descriptionBody.trim();
    if (!t) return toast.error("Title is required");
    if (!b) return toast.error("Description is required");
    if (descAddLoading) return;

    const existsLocal = descriptions.some(
      (d) => d.title.toLowerCase() === t.toLowerCase()
    );
    if (existsLocal) {
      toast.error("Title already exists");
      return;
    }

    setDescAddLoading(true);
    try {
      const created = await saveDescriptionToDb({ title: t, body: b });
      if (created) {
        setDescriptions((prev) =>
          [...prev, created].sort((a, b) => a.title.localeCompare(b.title))
        );
        setSelectedDescriptionId(String(created.id));
        toast.success("Description added");
        setDescriptionTitle("");
        setDescriptionBody("");
      }
    } finally {
      setDescAddLoading(false);
    }
  };

  const deleteDescription = async (id) => {
    setDescDeletingId(id);
    try {
      const res = await api.delete(`/admin/manage-products/descriptions/${id}`);
      toast.success(res.data.message);
      setDescriptions((prev) => prev.filter((d) => String(d.id) !== String(id)));
      setSelectedDescriptionId((sel) => (String(sel) === String(id) ? "" : sel));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete description");
    } finally {
      setDescDeletingId(null);
    }
  };



  // size guide (single image, required)
  const [sizeGuides, setSizeGuides] = useState([]);     // [{id,title,storage_key,...}]
  const [sizeGuideId, setSizeGuideId] = useState("");
  const [sgEditingId, setSgEditingId] = useState("");
  const [sgTitle, setSgTitle] = useState("");
  const [sgNewImage, setSgNewImage] = useState(null);
  const [sgPreview, setSgPreview] = useState("");
  const [sgAddLoading, setSgAddLoading] = useState(false);
  const [sgUpdateLoading, setSgUpdateLoading] = useState(false);
  const [sgDeletingId, setSgDeletingId] = useState(null);

  const startEditingSizeGuide = (g) => {
    setSgEditingId(String(g.id));
    setSgTitle(g.title || "");
    setSgNewImage(null);
    setSgPreview(g.url || "");
  };

  const cancelEditingSizeGuide = () => {
    setSgEditingId("");
    setSgTitle("");
    setSgNewImage(null);
    setSgPreview("");
  };

  useEffect(() => {
    const loadSizeGuides = async () => {
      try {
        const { data } = await api.get("/admin/manage-products/size-guides");
        setSizeGuides(data || []);
      } catch {
        toast.error("Failed to load size guides");
      }
    };
    loadSizeGuides();
  }, []);


  const addSizeGuide = async () => {
    const t = sgTitle.trim();
    if (!t) return toast.error("Title is required");
    if (!sgNewImage) return toast.error("Image is required");
    if (sgAddLoading) return;

    const fd = new FormData();
    fd.append("title", t);
    fd.append("image", sgNewImage, sgNewImage.name || "size-guide.png");

    setSgAddLoading(true);
    try {
      const { data } = await api.post("/admin/manage-products/size-guides", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const created = data.sizeGuide;
      setSizeGuides((prev) => [created, ...prev]);
      setSizeGuideId(String(created.id));
      cancelEditingSizeGuide();
      toast.success("Size guide added");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add size guide";
      const detail = err?.response?.data?.detail;
      toast.error(msg + (detail ? ` — ${detail}` : ""));
    } finally {
      setSgAddLoading(false);
    }
  };

  const updateSizeGuide = async () => {
    const t = sgTitle.trim();
    if (!sgEditingId) return;
    if (!t) return toast.error("Title is required");
    if (sgUpdateLoading) return;

    const fd = new FormData();
    fd.append("title", t);
    if (sgNewImage) {
      fd.append("image", sgNewImage, sgNewImage.name || "size-guide.png");
    }

    setSgUpdateLoading(true);
    try {
      const { data } = await api.patch(
        `/admin/manage-products/size-guides/${sgEditingId}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updated = data.sizeGuide;
      setSizeGuides((prev) =>
        prev.map((g) => (String(g.id) === String(updated.id) ? updated : g))
      );
      setSizeGuideId(String(updated.id));
      cancelEditingSizeGuide();
      toast.success("Size guide updated");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update size guide";
      const detail = err?.response?.data?.detail;
      toast.error(msg + (detail ? ` — ${detail}` : ""));
    } finally {
      setSgUpdateLoading(false);
    }
  };


  const deleteSizeGuide = async (id) => {
    setSgDeletingId(id);
    try {
      await api.delete(`/admin/manage-products/size-guides/${id}`);
      setSizeGuides((prev) => prev.filter((g) => String(g.id) !== String(id)));
      setSizeGuideId((sel) => (String(sel) === String(id) ? "" : sel));
      if (String(sgEditingId) === String(id)) cancelEditingSizeGuide();
      toast.success("Size guide deleted");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete size guide";
      toast.error(msg);
    } finally {
      setSgDeletingId(null);
    }
  };




  // care guides
  // Care Guides (like Description)
  const [careGuides, setCareGuides] = useState([]);            // [{id,title,body}]
  const [careGuideId, setCareGuideId] = useState("");          // selected
  const [careTitle, setCareTitle] = useState("");
  const [careBody, setCareBody] = useState("");
  const [editingCareId, setEditingCareId] = useState("");
  const [careAddLoading, setCareAddLoading] = useState(false);
  const [careUpdateLoading, setCareUpdateLoading] = useState(false);
  const [careDeletingId, setCareDeletingId] = useState(null);

  useEffect(() => {
    const loadCareGuides = async () => {
      try {
        const { data } = await api.get("/admin/manage-products/care-guides");
        setCareGuides(data || []);
      } catch {
        toast.error("Failed to load care guides");
      }
    };
    loadCareGuides();
  }, []);

  const startEditingCare = (item) => {
    setEditingCareId(String(item.id));
    setCareGuideId(String(item.id));
    setCareTitle(item.title);
    setCareBody(item.body);
  };

  const cancelEditingCare = () => {
    setEditingCareId("");
    setCareTitle("");
    setCareBody("");
  };

  const addCareGuide = async () => {
    const t = careTitle.trim();
    const b = careBody.trim();
    if (!t) return toast.error("Title is required");
    if (!b) return toast.error("Care guide body is required");
    if (careAddLoading) return;

    const existsLocal = careGuides.some((g) => g.title.toLowerCase() === t.toLowerCase());
    if (existsLocal) return toast.error("Care guide title already exists");

    setCareAddLoading(true);
    try {
      const { data } = await api.post("/admin/manage-products/care-guides", { title: t, body: b });
      const created = data.careGuide;
      setCareGuides((prev) => [...prev, created].sort((a, b) => a.title.localeCompare(b.title)));
      setCareGuideId(String(created.id));
      setCareTitle(""); setCareBody("");
      toast.success("Care guide added");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add care guide");
    } finally {
      setCareAddLoading(false);
    }
  };

  const updateCareGuide = async () => {
    const t = careTitle.trim();
    const b = careBody.trim();
    if (!editingCareId) return;
    if (!t) return toast.error("Title is required");
    if (!b) return toast.error("Care guide body is required");
    if (careUpdateLoading) return;

    setCareUpdateLoading(true);
    try {
      const { data } = await api.patch(`/admin/manage-products/care-guides/${editingCareId}`, { title: t, body: b });
      const updated = data.careGuide;
      setCareGuides((prev) =>
        prev.map((g) => (String(g.id) === String(updated.id) ? updated : g)).sort((a, b) => a.title.localeCompare(b.title))
      );
      setCareGuideId(String(updated.id));
      setEditingCareId("");
      setCareTitle(""); setCareBody("");
      toast.success("Care guide updated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update care guide");
    } finally {
      setCareUpdateLoading(false);
    }
  };

  const deleteCareGuide = async (id) => {
    setCareDeletingId(id);
    try {
      await api.delete(`/admin/manage-products/care-guides/${id}`);
      setCareGuides((prev) => prev.filter((g) => String(g.id) !== String(id)));
      setCareGuideId((sel) => (String(sel) === String(id) ? "" : sel));
      toast.success("Care guide deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete care guide");
    } finally {
      setCareDeletingId(null);
    }
  };


  const [suppliers, setSuppliers] = useState([]); // [{id, name, contactPerson, address, phone, email}]
  // const [selectedSupplierId, setSelectedSupplierId] = useState(""); // for the Select
  const [editingSupplierId, setEditingSupplierId] = useState(""); // "" = add mode, otherwise edit

  // form fields in Dialog
  const [supplierName, setSupplierName] = useState("");
  const [supplierContactPerson, setSupplierContactPerson] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  // Supplier loading states
  const [supplierAddLoading, setSupplierAddLoading] = useState(false);
  const [supplierUpdateLoading, setSupplierUpdateLoading] = useState(false);
  const [supplierDeletingId, setSupplierDeletingId] = useState(null);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await api.get("/admin/manage-products/suppliers"); // expects array as described above
        setSuppliers(res.data || []);
      } catch (err) {
        toast.error("Failed to load suppliers");
        console.error(err);
      }
    };
    loadSuppliers();
  }, []);

  const resetSupplierForm = () => {
    setEditingSupplierId("");
    setSupplierName("");
    setSupplierContactPerson("");
    setSupplierAddress("");
    setSupplierPhone("");
    setSupplierEmail("");
  };

  const startEditingSupplier = (s) => {
    setEditingSupplierId(String(s.id));
    setSupplierName(s.name || "");
    setSupplierContactPerson(s.contactPerson || "");
    setSupplierAddress(s.address || "");
    setSupplierPhone(s.phone || "");
    setSupplierEmail(s.email || "");
  };

  const cancelEditingSupplier = () => {
    resetSupplierForm();
  };

  const saveSupplierToDb = async (payload) => {
    try {
      const res = await api.post("/admin/manage-products/suppliers", payload);
      return res.data.supplier; // {id, name, contactPerson, address, phone, email}
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Supplier already exists");
      } else {
        toast.error(err.response?.data?.error || "❌ Failed to add supplier");
      }
      return false;
    }
  };

  const updateSupplierToDb = async (id, payload) => {
    try {
      const res = await api.patch(`/admin/manage-products/suppliers/${id}`, payload);
      return res.data.supplier;
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("A supplier with this name already exists");
      } else {
        toast.error(
          err.response?.data?.error || "❌ Failed to update supplier"
        );
      }
      return false;
    }
  };

  const [variantDetails, setVariantDetails] = useState({});




  const setVariantDetail = (variantId, key, value) => {
    setVariantDetails((prev) => ({
      ...prev,
      [String(variantId)]: {
        ...getVariantDetails(variantId),
        [key]: value,
      },
    }));
  };

  const deleteSupplier = async (id) => {
    setSupplierDeletingId(id);
    try {
      const res = await api.delete(`/admin/manage-products/suppliers/${id}`);
      toast.success(res.data.message || "Supplier deleted");
      setSuppliers((prev) => prev.filter((s) => String(s.id) !== String(id)));
      setVariantDetails((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((vid) => {
          if (String(next[vid]?.supplierId) === String(id)) {
            next[vid] = { ...next[vid], supplierId: "" };
          }
        });
        return next;
      });
      if (String(editingSupplierId) === String(id)) resetSupplierForm();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete supplier");
    } finally {
      setSupplierDeletingId(null);
    }
  };

  const validateSupplier = () => {
    const name = supplierName.trim();
    const email = supplierEmail.trim();
    const phone = supplierPhone.trim();
    const address = supplierAddress.trim();
    const contact = supplierContactPerson.trim();

    if (!name) return toast.error("Supplier name is required"), false;
    if (!contact) return toast.error("Contact person is required"), false;
    if (!address) return toast.error("Address is required"), false;
    if (!phone) return toast.error("Contact number is required"), false;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast.error("Invalid email format"), false;

    // local case-insensitive duplicate by name (exclude self on edit)
    const exists = suppliers.some(
      (s) =>
        s.name?.toLowerCase() === name.toLowerCase() &&
        String(s.id) !== String(editingSupplierId || "")
    );
    if (exists) return toast.error("Supplier name already exists"), false;

    return { name, contactPerson: contact, address, phone, email };
  };
  const addSupplier = async () => {
    const payload = validateSupplier();
    if (!payload || supplierAddLoading) return;

    setSupplierAddLoading(true);
    const created = await saveSupplierToDb(payload);
    if (created) {
      setSuppliers((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Supplier added");
      resetSupplierForm();
    }
    setSupplierAddLoading(false);
  };

  const updateSupplier = async () => {
    if (!editingSupplierId || supplierUpdateLoading) return;
    const payload = validateSupplier();
    if (!payload) return;

    setSupplierUpdateLoading(true);
    const updated = await updateSupplierToDb(editingSupplierId, payload);
    if (updated) {
      setSuppliers((prev) =>
        prev
          .map((s) => (String(s.id) === String(updated.id) ? updated : s))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Supplier updated");
      resetSupplierForm();
    }
    setSupplierUpdateLoading(false);
  };

  // Shipments
  const PACKAGE_TYPES = [
    "Small Pouch",
    "Medium Pouch",
    "Large Pouch",
    "Small Box",
    "Medium Box",
    "Large Box",
  ];

  const [shipments, setShipments] = useState([]);
  // [{ id, packageType, weightKg, lengthCm, widthCm, heightCm }]

  // const [selectedShipmentId, setSelectedShipmentId] = useState(""); // for Select
  const [editingShipmentId, setEditingShipmentId] = useState(""); // "" = add mode
  // Shipment loading states
  const [shipmentAddLoading, setShipmentAddLoading] = useState(false);
  const [shipmentUpdateLoading, setShipmentUpdateLoading] = useState(false);
  const [shipmentDeletingId, setShipmentDeletingId] = useState(null);

  // form fields in Dialog
  const [packageType, setPackageType] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const res = await api.get("/admin/manage-products/shipments");
        setShipments(res.data || []);
      } catch (err) {
        toast.error("Failed to load shipment presets");
        console.error(err);
      }
    };
    loadShipments();
  }, []);

  const resetShipmentForm = () => {
    setEditingShipmentId("");
    setPackageType("");
    setWeightKg("");
    setLengthCm("");
    setWidthCm("");
    setHeightCm("");
  };

  const startEditingShipment = (s) => {
    setEditingShipmentId(String(s.id));
    setPackageType(s.packageType || "");
    setWeightKg(String(s.weightKg ?? ""));
    setLengthCm(String(s.lengthCm ?? ""));
    setWidthCm(String(s.widthCm ?? ""));
    setHeightCm(String(s.heightCm ?? ""));
  };

  const cancelEditingShipment = () => {
    resetShipmentForm();
  };

  const parseNum = (v) => {
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : NaN;
  };

  const validateShipment = () => {
    const type = packageType.trim();
    const w = parseNum(weightKg);
    const l = parseNum(lengthCm);
    const wi = parseNum(widthCm);
    const h = parseNum(heightCm);

    if (!type) return toast.error("Package type is required"), false;
    if (!PACKAGE_TYPES.includes(type))
      return toast.error("Invalid package type"), false;

    if (!(w > 0)) return toast.error("Weight must be a positive number"), false;
    if (!(l > 0)) return toast.error("Length must be a positive number"), false;
    if (!(wi > 0)) return toast.error("Width must be a positive number"), false;
    if (!(h > 0)) return toast.error("Height must be a positive number"), false;

    return {
      packageType: type,
      weightKg: w,
      lengthCm: l,
      widthCm: wi,
      heightCm: h,
    };
  };

  const saveShipmentToDb = async (payload) => {
    try {
      const res = await api.post("/admin/manage-products/shipments", payload);
      return res.data.shipment; // {id, packageType, weightKg, lengthCm, widthCm, heightCm}
    } catch (err) {
      toast.error(
        err.response?.data?.error || "❌ Failed to add shipment preset"
      );
      return false;
    }
  };

  const updateShipmentToDb = async (id, payload) => {
    try {
      const res = await api.patch(`/admin/manage-products/shipments/${id}`, payload);
      return res.data.shipment;
    } catch (err) {
      toast.error(
        err.response?.data?.error || "❌ Failed to update shipment preset"
      );
      return false;
    }
  };
  const deleteShipment = async (id) => {
    setShipmentDeletingId(id);
    try {
      const res = await api.delete(`/admin/manage-products/shipments/${id}`);
      toast.success(res.data.message || "Shipment preset deleted");
      setShipments((prev) => prev.filter((s) => String(s.id) !== String(id)));

      // clear this shipment from any variant that had it selected
      setVariantDetails((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((vid) => {
          if (String(next[vid]?.shipmentId) === String(id)) {
            next[vid] = { ...next[vid], shipmentId: "" };
          }
        });
        return next;
      });

      if (String(editingShipmentId) === String(id)) resetShipmentForm();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete shipment preset");
    } finally {
      setShipmentDeletingId(null);
    }
  };

  const addShipment = async () => {
    const payload = validateShipment();
    if (!payload || shipmentAddLoading) return;

    setShipmentAddLoading(true);
    const created = await saveShipmentToDb(payload);
    if (created) {
      setShipments((prev) =>
        [...prev, created].sort((a, b) => a.packageType.localeCompare(b.packageType))
      );
      toast.success("Shipment preset added");
      resetShipmentForm();
    }
    setShipmentAddLoading(false);
  };

  const updateShipment = async () => {
    if (!editingShipmentId || shipmentUpdateLoading) return;
    const payload = validateShipment();
    if (!payload) return;

    setShipmentUpdateLoading(true);
    const updated = await updateShipmentToDb(editingShipmentId, payload);
    if (updated) {
      setShipments((prev) =>
        prev
          .map((s) => (String(s.id) === String(updated.id) ? updated : s))
          .sort((a, b) => a.packageType.localeCompare(b.packageType))
      );
      toast.success("Shipment preset updated");
      resetShipmentForm();
    }
    setShipmentUpdateLoading(false);
  };

  // toggling status
  const [toggling, setToggling] = useState({}); // { [variantId]: true }
  const [saving, setSaving] = useState({});     // { [variantId]: true }

  const [stockEditLoading, setStockEditLoading] = useState(false);





  // Store images per variant: { [variantId]: Array<{ file: File|null, url: string }> }
  const [variantImagesMap, setVariantImagesMap] = useState({});

  // Get images for a variant
  const getVariantImages = (variantId) =>
    variantImagesMap[String(variantId)] || [];

  // Set images for a variant
  const setVariantImages = (variantId, images) =>
    setVariantImagesMap((prev) => ({ ...prev, [String(variantId)]: images }));


  const MAX_IMAGES_PER_VARIANT = 5;

  // Add selected files (enforce max 5, images only)
  const handleVariantFiles = (variantId, fileList) => {
    const incoming = Array.from(fileList || []).filter((f) =>
      f.type?.startsWith?.("image/")
    );
    if (!incoming.length) return;

    const picked = getVariantImages(variantId);
    const d = getVariantDetails(variantId);
    const savedCount = Array.isArray(d.images) ? d.images.length : 0;

    const remaining = Math.max(0, MAX_IMAGES_PER_VARIANT - savedCount - picked.length);
    if (remaining === 0) {
      toast.error("Max 5 images per variant");
      return;
    }

    const trimmed = incoming.slice(0, remaining);
    if (incoming.length > remaining) {
      toast.error(`Max 5 images per variant. You can add only ${remaining} more.`);
    }

    const add = trimmed.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setVariantImages(variantId, [...picked, ...add]);
  };

  // Make clicked thumbnail the main (move to index 0)
  const makeMainVariantImage = (variantId, index) => {
    const arr = [...getVariantImages(variantId)];
    if (index < 0 || index >= arr.length) return;
    const [picked] = arr.splice(index, 1);
    const next = [picked, ...arr];
    setVariantImages(variantId, next);
  };

  // Remove image (and revoke URL if it's a blob)
  const removeVariantImage = (variantId, index) => {
    const arr = [...getVariantImages(variantId)];
    if (!arr[index]) return;

    const url = arr[index].url;
    if (typeof url === "string" && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }

    arr.splice(index, 1);
    setVariantImages(variantId, arr);
  };


  // extend/edit buffer per-variant (reusing your existing variantDetails state)
  const getVariantDetails = (variantId) =>
    variantDetails[String(variantId)] || {
      sku: "",
      price: "",
      compareAt: "",
      costPerItem: "",
      scarcityStock: "",
      stockEdit: "",    // optional: for stock dialog
      stockReason: "",  // optional: for stock dialog
      supplierId: "",
      shipmentId: "",
      images: [],
    };

  // prime details when opening dialog
  const primeVariantDetails = React.useCallback((rows) => {
    setVariantDetails((prev) => {
      const next = { ...prev };
      for (const r of rows) {
        const id = String(r.id);
        if (!next[id]) {
          next[id] = {
            price: r.price ?? "",
            compareAt: r.compareAt ?? "",
            costPerItem: r.costPerItem ?? "",
            stock: r.stock ?? 0,
            scarcityStock: r.scarcityStock ?? 0,
            supplierId: r.supplierId ? String(r.supplierId) : "",
            shipmentId: r.shipmentId ? String(r.shipmentId) : "",
            images: r.images ?? [],
          };
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!loadingProd && variantRows.length) {
      primeVariantDetails(variantRows);
    }
  }, [loadingProd, variantRows, primeVariantDetails]);
  // small formatters/computations
  const fmtMoney = (n) =>
    n == null || n === "" || !Number.isFinite(Number(n))
      ? "—"
      : `₱${Number(n).toFixed(2)}`;

  const computeMargin = (price, cost) => {
    const p = Number(price);
    const c = Number(cost);
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(c))
      return { marginPct: null, profit: null };
    const profit = p - c;
    const marginPct = (profit / p) * 100;
    return { marginPct, profit };
  };


  // helper to toggle active/inactive (by id only)
  const toggleVariantActive = async (vr) => {
    const id = vr.id;
    if (!id || toggling[id]) return;

    // Check price and cost per item before activating
    if (!vr.isActive) { // about to activate
      const price = Number(vr.price ?? 0);
      const cost = Number(vr.costPerItem ?? 0);

      if (price <= 0 || cost <= 0) {
        toast.error("Cannot activate: Price and Cost per Item must be greater than zero.");
        return;
      }
    }

    setToggling((m) => ({ ...m, [id]: true }));
    const next = !vr.isActive;

    try {
      await api.patch(`/admin/manage-products/variants/${id}`, { is_active: next });

      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          variants: (p.variants || []).map((v) =>
            v.id === id ? { ...v, is_active: next } : v
          ),
        }))
      );

      toast.success(`Variant ${next ? "activated" : "deactivated"}.`);
    } catch (err) {
      const msg = err?.response?.data?.error;
      if (err?.response?.status === 409) {
        toast.error(msg || "Only one active batch per variant is allowed.");
      } else {
        toast.error(msg || "Failed to update status.");
      }
    } finally {
      setToggling((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    }
  };


  // Saved images marked for deletion: { [variantId]: Set<number> }
  const [variantDeleteSet, setVariantDeleteSet] = useState({});

  const getDeleteSet = (variantId) => variantDeleteSet[String(variantId)] || new Set();

  const markDeleteImage = (variantId, imageId) => {
    const key = String(variantId);
    setVariantDeleteSet((prev) => {
      const set = new Set(prev[key] || []);
      set.add(Number(imageId));
      return { ...prev, [key]: set };
    });
  };

  // Helper: saved images excluding those marked for deletion
  const getExistingImages = (variantId) => {
    const d = getVariantDetails(variantId);
    const del = getDeleteSet(variantId);
    const arr = Array.isArray(d.images) ? d.images : [];
    return arr.filter((im) => !del.has(im.id));
  };

  const clearVariantWorkingBuffers = (variantId) => {
    const key = String(variantId);

    // clear picked (revoke blobs)
    setVariantImagesMap((prev) => {
      const next = { ...prev };
      (next[key] || []).forEach((x) => {
        if (typeof x?.url === "string" && x.url.startsWith("blob:")) {
          URL.revokeObjectURL(x.url);
        }
      });
      delete next[key];
      return next;
    });

    // clear deletions
    setVariantDeleteSet((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const removeMainImage = (variantId) => {
    const picked = getVariantImages(variantId);
    if (picked.length > 0) {
      removeVariantImage(variantId, 0);
      return;
    }

    const existing = getExistingImages(variantId);
    if (!existing.length) return;

    const currentMain = existing.find((i) => i.is_main) || existing[0];
    if (currentMain?.id != null) {
      markDeleteImage(variantId, currentMain.id);
    }
  };

  // Remove a specific saved (persisted) thumb
  const removeSavedThumb = (variantId, imageId) => {
    markDeleteImage(variantId, imageId);
  };



  const updateVariant = async (row) => {
    const id = row.id;
    if (saving[id]) return;

    const d = getVariantDetails(id);

    const numOrNull = (v) => {
      if (v === "" || v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const neqNum = (a, b) =>
      a == null && (b === "" || b == null)
        ? false
        : Number(a ?? null) !== Number(b ?? null);

    const changed = {};

    if (neqNum(row.price, d.price)) changed.price = numOrNull(d.price);
    if (neqNum(row.compareAt, d.compareAt)) changed.compare_at = numOrNull(d.compareAt);
    if (neqNum(row.costPerItem, d.costPerItem)) changed.cost_per_item = numOrNull(d.costPerItem);

    if ((row.supplierId ?? "") !== (d.supplierId ?? "")) {
      changed.supplier_id = d.supplierId ? Number(d.supplierId) : null;
    }

    if ((row.shipmentId ?? "") !== (d.shipmentId ?? "")) {
      changed.shipment_id = d.shipmentId ? Number(d.shipmentId) : null;
    }

    const scarcityChanged = neqNum(row.scarcityStock, d.scarcityStock);
    const newScarcity = Number(d.scarcityStock ?? 0);
    const currentStock = Number(row.stock ?? 0);

    // ✅ Validate scarcity does not exceed stock
    if (scarcityChanged && newScarcity > currentStock) {
      toast.error("Scarcity stock cannot exceed available stock.");
      return;
    }

    if (scarcityChanged) {
      changed.scarcity_stock = d.scarcityStock === "" ? 0 : Number(d.scarcityStock);
    }

    // Images / deletions
    const picked = getVariantImages(id);
    const newFiles = picked.map((x) => x.file);
    const deleteIds = Array.from(getDeleteSet(id));

    const hasFieldChanges = Object.keys(changed).length > 0;
    const hasImageAdd = newFiles.length > 0;
    const hasImageDel = deleteIds.length > 0;

    if (!hasFieldChanges && !hasImageAdd && !hasImageDel) {
      toast.info("Nothing to update");
      return;
    }

    // 🚫 Prevent updating price/cost_per_item to 0 if variant is active
    if (row.isActive) {
      if (changed.price !== undefined && Number(changed.price) <= 0) {
        toast.error("Cannot set price to zero for an active variant.");
        return;
      }
      if (changed.cost_per_item !== undefined && Number(changed.cost_per_item) <= 0) {
        toast.error("Cannot set cost per item to zero for an active variant.");
        return;
      }
    }

    const form = new FormData();
    const imagesPayload = {};

    if (hasImageDel) imagesPayload.deleteIds = deleteIds;
    if (hasImageAdd) imagesPayload.mainNewIndex = 0;

    form.append("payload", JSON.stringify({ fields: changed, images: imagesPayload }));
    newFiles.forEach((f) => form.append("newImages", f));

    setSaving((s) => ({ ...s, [id]: true }));

    try {
      const res = await api.patch(`/admin/manage-products/update-variant/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data?.variant;
      if (!updated) throw new Error("No variant returned");

      setProducts((prev) =>
        prev.map((p) => {
          const list = Array.isArray(p.variants) ? p.variants : [];
          const idx = list.findIndex((v) => v.id === id);
          if (idx === -1) return p;
          const nextVariants = [...list];
          nextVariants[idx] = { ...list[idx], ...updated, images: updated.images || [] };
          return { ...p, variants: nextVariants };
        })
      );

      setVariantDetails((prev) => ({
        ...prev,
        [String(id)]: {
          ...prev[String(id)],
          price: updated.price ?? d.price ?? "",
          compareAt: updated.compare_at ?? d.compareAt ?? "",
          costPerItem: updated.cost_per_item ?? d.costPerItem ?? "",
          scarcityStock:
            updated.scarcity_stock ?? (d.scarcityStock === "" ? 0 : d.scarcityStock ?? 0),
          supplierId: updated.supplier_id ? String(updated.supplier_id) : "",
          shipmentId: updated.shipment_id ? String(updated.shipment_id) : "",
          images: Array.isArray(updated.images) ? updated.images : [],
        },
      }));

      clearVariantWorkingBuffers(id);

      toast.success("Variant updated");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update variant");
    } finally {
      setSaving((s) => {
        const c = { ...s };
        delete c[id];
        return c;
      });
    }
  };



  // logs per variant
  const [variantLogs, setVariantLogs] = useState({}); // { [variantId]: Log[] }
  const getLogs = (variantId) => variantLogs[String(variantId)] || [];
  const setLogs = (variantId, logs) =>
    setVariantLogs((prev) => ({ ...prev, [String(variantId)]: logs }));

  // somewhere in your component file (JSX)
  const isNonZeroInt = (v) => Number.isInteger(Number(v)) && Number(v) !== 0;


  const loadVariantLogs = async (variantId) => {
    try {
      const res = await api.get(`/admin/manage-products/variants/${variantId}/stock-logs`);
      setLogs(variantId, res.data?.logs || []);
    } catch {
      setLogs(variantId, []);
    }
  };

  const formatLogDetails = (lg) => {
    const delta = Number(lg.delta || 0);
    const from = Number(lg.stock_before ?? lg.from_stock ?? lg.old_stock ?? 0);
    const to = Number(lg.stock_after ?? from + delta);
    const qty = Math.abs(delta);

    switch (lg.reason) {
      case 'Correction': return delta >= 0 ? `Added ${qty} (${from} → ${to})` : `Removed ${qty} (${from} → ${to})`;
      case 'Damaged': return `Damaged ${qty} (${from} → ${to})`;
      case 'Theft/lost': return `Removed ${qty} (${from} → ${to})`;
      case 'Return restock': return `Restocked ${qty} (${from} → ${to})`;
      default: return delta >= 0 ? `Added ${qty} (${from} → ${to})` : `Removed ${qty} (${from} → ${to})`;
    }
  };

  const applyStockAdjustment = async (row) => {
    if (stockEditLoading) return; // Prevent double submit
    setStockEditLoading(true);

    const id = row.id;
    const d = getVariantDetails(id);

    let reason = (d.stockReason || "").trim();
    if (!reason) {
      toast.error("Please select a reason");
      setStockEditLoading(false);
      return;
    }

    const amt = Number(d.stockEdit);
    if (!Number.isInteger(amt) || amt === 0) {
      toast.error("Enter a non-zero integer");
      setStockEditLoading(false);
      return;
    }

    // Require a non-empty description
    const description = (d.stockDescription || "").trim();
    if (!description) {
      toast.error("Please enter a description for this adjustment");
      setStockEditLoading(false);
      return;
    }

    // derive delta from amount + reason (must match backend rules)
    let delta = amt;
    if (reason === "Damaged" || reason === "Theft/lost") delta = -Math.abs(amt);
    if (reason === "Return restock") delta = Math.abs(amt);

    const current = Number(row.stock ?? 0);

    // 🔧 Auto-fix: if stock is 0 and user picked a decreasing reason with a positive amount,
    // switch to an adding reason so they can increase from zero.
    if (current === 0 && delta < 0) {
      reason = "Return restock";
      delta = Math.abs(amt);
      toast.info('Reason changed to "Return restock" to allow increasing from 0.');
    }

    if (current + delta < 0) {
      toast.error("Resulting stock cannot be negative");
      setStockEditLoading(false);
      return;
    }

    try {
      const res = await api.post(`/admin/manage-products/variants/${id}/stock-adjust`, {
        delta,
        reason,
        by: admin?.email || null,
        description, // <-- send description to backend
      });

      const updated = res.data?.variant;
      const log = res.data?.log;

      if (updated) {
        setProducts(prev => prev.map(p => {
          const vs = p.variants || [];
          const idx = vs.findIndex(v => v.id === id);
          if (idx === -1) return p;
          const next = [...vs];
          next[idx] = { ...vs[idx], ...updated };
          return { ...p, variants: next };
        }));
      }

      if (log) setLogs(id, [log, ...getLogs(id)]);
      setVariantDetail(id, "stockEdit", "");
      setVariantDetail(id, "stockReason", "");
      setVariantDetail(id, "stockDescription", ""); // Reset description field
      toast.success("Stock updated");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update stock");
    } finally {
      setStockEditLoading(false);
    }
  };

  const [editedName, setEditedName] = useState("");

  const updateProductDetails = async (p) => {
    const payload = {
      name: editedName.trim(),
      categoryId: Number(category),
      typeId: Number(type),
      materialId: Number(material),
      descriptionId: Number(selectedDescriptionId),
      tagIds: selectedTags.map(Number),

      // NEW
      sizeGuideId: sizeGuideId ? Number(sizeGuideId) : null,
      careGuideId: careGuideId ? Number(careGuideId) : null,
    };

    // compare tag IDs sorted
    const prevTags = (p.tags || []).map((t) => t.id).sort((a, b) => a - b);
    const newTags = [...payload.tagIds].sort((a, b) => a - b);


    // NEW: compare current guides vs selected
    const prevSizeId = p.size_guide?.id ?? null;
    const prevCareId = p.care_guide?.id ?? null;

    const isSame =
      payload.name === (p.name?.trim() || "") &&
      payload.categoryId === p.category?.id &&
      payload.typeId === p.type?.id &&
      payload.materialId === p.material?.id &&
      payload.descriptionId === p.description?.id &&
      JSON.stringify(prevTags) === JSON.stringify(newTags) &&
      (payload.sizeGuideId ?? null) === (prevSizeId ?? null) &&
      (payload.careGuideId ?? null) === (prevCareId ?? null);

    if (isSame) {
      toast.info("No changes made");
      return;
    }

    try {
      await api.patch(`/admin/manage-products/${p.id}`, payload);
      toast.success("Product updated");
      loadProducts(); // refresh list
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update product");
    }
  };


  // const handleDeleteProduct = async (productId) => {

  //   try {
  //     const res = await api.delete(`/admin/manage-products/${productId}`);
  //     toast.success(res.data.message || "Product deleted");
  //     loadProducts(); // refresh the list
  //   } catch (err) {
  //     toast.error(err?.response?.data?.error || "Failed to delete product");
  //   }
  // };

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category?.id === Number(categoryFilter);
    const matchesType = !typeFilter || p.type?.id === Number(typeFilter);
    return matchesSearch && matchesCategory && matchesType;
  });

  const [skuSearch, setSkuSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // default to 'all'
  const [stockSort, setStockSort] = useState("none"); // default to no sort


  const filteredVariants = useMemo(() => {
    let list = [...variantRows];

    // 1. Search by SKU
    if (skuSearch.trim()) {
      list = list.filter(v =>
        v.sku.toLowerCase().includes(skuSearch.trim().toLowerCase())
      );
    }

    // 2. Filter by Status
    if (statusFilter === "active") {
      list = list.filter(v => v.isActive);
    } else if (statusFilter === "inactive") {
      list = list.filter(v => !v.isActive);
    }

    // 3. Sort by Stock
    if (stockSort === "asc") {
      list.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
    } else if (stockSort === "desc") {
      list.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
    }

    return list;
  }, [variantRows, skuSearch, statusFilter, stockSort]);


  // For Product table
  const [productPage, setProductPage] = useState(1);
  const productsPerPage = 5;

  // For Variant table
  const [variantPage, setVariantPage] = useState(1);
  const variantsPerPage = 10;

  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, productPage]);

  const totalVariantPages = Math.ceil(filteredVariants.length / variantsPerPage);
  const paginatedVariants = useMemo(() => {
    const start = (variantPage - 1) * variantsPerPage;
    return filteredVariants.slice(start, start + variantsPerPage);
  }, [filteredVariants, variantPage]);


  useEffect(() => {
    setProductPage(1);
  }, [search, categoryFilter, typeFilter]);

  useEffect(() => {
    setVariantPage(1);
  }, [skuSearch, statusFilter, stockSort]);




  const [restockAmount, setRestockAmount] = useState("");
  const [restockPrice, setRestockPrice] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [restockScarcity, setRestockScarcity] = useState("");
  const [restockLoading, setRestockLoading] = useState(false);

  const isInt = (val) => /^-?\d+$/.test(val);
  const isDecimal = (val) => /^(\d+)?(\.\d*)?$/.test(val);

  const handleRestock = async (row) => {
    if (restockLoading) return;
    setRestockLoading(true);

    const variantId = row.id;

    // Clean numeric inputs
    const amount = parseInt(restockAmount || "0", 10);
    const price = parseFloat(restockPrice || "0");
    const cost = parseFloat(restockCost || "0");
    const scarcity = parseInt(restockScarcity || "0", 10);

    // Validation
    if (!isInt(restockAmount) || !amount || amount <= 0) {
      toast.error("Stock amount must be a positive integer.");
      setRestockLoading(false);
      return;
    }
    if (!isDecimal(restockPrice) || !price || price <= 0) {
      toast.error("Price must be a positive number.");
      setRestockLoading(false);
      return;
    }
    if (!isDecimal(restockCost) || !cost || cost <= 0) {
      toast.error("Cost per item must be a positive number.");
      setRestockLoading(false);
      return;
    }
    if (!isInt(restockScarcity) || (restockScarcity !== "" && (scarcity > amount || scarcity < 0))) {
      toast.error("Scarcity stock must be a non-negative integer and not exceed stock.");
      setRestockLoading(false);
      return;
    }

    const payload = {
      amount,
      price: isNaN(price) ? null : price,
      costPerItem: isNaN(cost) ? null : cost,
      scarcityStock: isNaN(scarcity) ? 0 : scarcity,
      reason: "Return restock",
    };

    try {
      await api.post(`/admin/manage-products/variants/${variantId}/restock`, payload);
      toast.success("New batch created.");
      loadProducts(); // reload products + variants
      setRestockAmount("");
      setRestockPrice("");
      setRestockCost("");
      setRestockScarcity("");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create new batch.");
    } finally {
      setRestockLoading(false);
    }
  };

  const getNextBatchNumber = (variantRow) => {
    const currentProductId = variantRow.productId;
    const currentOptions = variantRow.variantLabel;

    const matchingVariants = variantRows.filter(
      (v) =>
        v.productId === currentProductId &&
        v.variantLabel === currentOptions
    );

    const highestBatch = Math.max(...matchingVariants.map(v => v.batchNo ?? 1));
    return highestBatch + 1;
  };

  const [loading, setLoading] = useState(false);

  const [showSkeleton, setShowSkeleton] = useState(true);


  // Simulate an initial loading effect
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400); // simulate permission fetch, etc.
    return () => clearTimeout(timer);
  }, []);

  // Skeleton delay: 2s after loading finishes
  useEffect(() => {
    if (loading) setShowSkeleton(true);
    else {
      const timer = setTimeout(() => setShowSkeleton(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || showSkeleton) {

    return (
      <main className="flex flex-col gap-8 min-h-screen  ">
        {/* Product List Card */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-md flex flex-col gap-4 w-full max-w-full">
          <Skeleton className="h-7 w-36 sm:w-48 mb-2 bg-gray-200" />
          <div className="flex flex-col sm:flex-row flex-wrap justify-between gap-2 sm:gap-4 items-center">
            <Skeleton className="h-10 w-full sm:w-72 rounded bg-gray-100" />
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-full sm:w-48 rounded bg-gray-100" />
              <Skeleton className="h-10 w-full sm:w-48 rounded bg-gray-100" />
              <Skeleton className="h-10 w-full sm:w-24 rounded bg-gray-100" />
              <Skeleton className="h-10 w-full sm:w-24 rounded bg-gray-100" />
            </div>
            <Skeleton className="h-10 w-full sm:w-24 rounded bg-gray-100" />
          </div>
          {/* Table */}
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  {['Product Name', 'Category', 'Type', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-2 sm:px-4 py-3 text-left">
                      <Skeleton className="h-5 w-20 sm:w-24 bg-gray-200" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(2)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} className="px-2 sm:px-4 py-4">
                        <Skeleton className={j === 4 ? "h-9 w-20 sm:w-28 rounded bg-gray-100" : "h-5 w-24 sm:w-36 bg-gray-100"} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-center mt-4 gap-2">
            <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
            <Skeleton className="h-9 w-9 rounded bg-gray-100" />
            <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
          </div>
        </div>

        {/* Product List Card #2 (Repeat for variants or another list) */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-md flex flex-col gap-4 w-full max-w-full">
          <Skeleton className="h-7 w-36 sm:w-48 mb-2 bg-gray-200" />
          <div className="flex flex-col sm:flex-row flex-wrap justify-between gap-2 sm:gap-4 items-center">
            <Skeleton className="h-10 w-full sm:w-72 rounded bg-gray-100" />
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-full sm:w-48 rounded bg-gray-100" />
              <Skeleton className="h-10 w-full sm:w-48 rounded bg-gray-100" />
              <Skeleton className="h-10 w-full sm:w-24 rounded bg-gray-100" />
              <Skeleton className="h-10 w-full sm:w-24 rounded bg-gray-100" />
            </div>
            <Skeleton className="h-10 w-full sm:w-24 rounded bg-gray-100" />
          </div>
          {/* Table */}
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  {['Product Name', 'Category', 'Type', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-2 sm:px-4 py-3 text-left">
                      <Skeleton className="h-5 w-20 sm:w-24 bg-gray-200" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(2)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} className="px-2 sm:px-4 py-4">
                        <Skeleton className={j === 4 ? "h-9 w-20 sm:w-28 rounded bg-gray-100" : "h-5 w-24 sm:w-36 bg-gray-100"} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-center mt-4 gap-2">
            <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
            <Skeleton className="h-9 w-9 rounded bg-gray-100" />
            <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }



  return (
    <main className="flex  flex-col gap-[2rem] w-full">
      {/* Product details */}
      <section className="bg-white shadow-lg rounded-xl border border-gray-200 p-4 min-h-[20rem] w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Product List</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadProducts}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">

          <Input
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[14rem]"
          />

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[12rem]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[12rem]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full overflow-auto border rounded-md shadow-sm">
          <Table className="min-w-[800px] border-collapse">
            <TableCaption className="sr-only">
              {loadingProd
                ? "Loading products…"
                : filteredProducts.length === 0
                  ? "No products found."
                  : "All products"}
            </TableCaption>

            <TableHeader className="sticky top-0 z-10 bg-[#E1E7E4]">
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[14rem]">Created</TableHead>
                <TableHead className="text-right w-[10rem]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loadingProd && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading…</TableCell>
                </TableRow>
              )}

              {!loadingProd && filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}

              {!loadingProd && paginatedProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category?.name || "—"}</TableCell>
                  <TableCell>{p.type?.name || "—"}</TableCell>
                  <TableCell>{formatDate(p.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditedName(p.name);
                              setCategory(String(p.category?.id || ""));
                              setType(String(p.type?.id || ""));
                              setMaterial(String(p.material?.id || ""));
                              setSelectedTags((p.tags || []).map((t) => String(t.id)));
                              setSelectedDescriptionId(String(p.description?.id || ""));
                              // ⬇️ Prefill selected guides
                              setCareGuideId(String(p.care_guide?.id || ""));
                              setSizeGuideId(String(p.size_guide?.id || ""));
                            }}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined} className=" overflow-hidden sm:max-w-[520px]">
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                          </DialogHeader>

                          <ScrollArea className="h-[20rem]">
                            <section className="border flex flex-wrap justify-center p-[1rem] gap-[1rem] items-center">
                              <div className="flex flex-col justify-between w-[12rem] h-[5rem]">
                                <Label htmlFor="product-name" className="pt-3">
                                  Product Name
                                </Label>
                                <Input
                                  id="product-name"
                                  value={editedName}
                                  onChange={(e) => setEditedName(e.target.value)}
                                />
                              </div>
                              <div className="flex flex-col gap-2 w-[12rem]  h-[5rem]">
                                <div className="flex justify-between ">
                                  <Label
                                    id="productCategoryLabel"
                                    className="font-semibold cursor-pointer pb-3 mt-2"
                                  >
                                    Product Categories
                                  </Label>

                                </div>
                                <Select
                                  value={category}
                                  onValueChange={setCategory}
                                  name="productCategory"
                                >
                                  <SelectTrigger
                                    aria-labelledby="productCategoryLabel"
                                    className="w-[12rem]"
                                  >
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((c) => (
                                      <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-2 w-[12rem]  h-[5rem]">
                                <div className="flex justify-between">
                                  <Label
                                    id="productTypeLabel"
                                    className="font-semibold cursor-pointer"
                                  >
                                    Product Type
                                  </Label>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline">Edit</Button>
                                    </DialogTrigger>
                                    <DialogContent aria-describedby={undefined} className="flex flex-col h-auto ">
                                      <DialogHeader>
                                        <DialogTitle>Type Name</DialogTitle>
                                        <DialogDescription>
                                          Make changes to your type here. Click
                                          save when you&apos;re done.
                                        </DialogDescription>
                                      </DialogHeader>

                                      <div className="h-[20rem] flex flex-col gap-5  ">

                                        <Label htmlFor="newType">New Type</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            id="newType"
                                            value={newType}
                                            onChange={(e) =>
                                              setNewType(e.target.value)
                                            }
                                            onKeyDown={(e) =>
                                              e.key === "Enter" && addType()
                                            }
                                            placeholder="Add new type"
                                          />
                                          <Button
                                            type="button"
                                            onClick={addType}
                                            disabled={typeAddLoading}
                                          >
                                            {typeAddLoading ? (
                                              <span className="flex items-center gap-2">
                                                <svg
                                                  className="animate-spin h-4 w-4 text-gray-500"
                                                  viewBox="0 0 16 16"
                                                  fill="none"
                                                >
                                                  <circle
                                                    className="opacity-25"
                                                    cx="8"
                                                    cy="8"
                                                    r="7"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                  />
                                                  <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z"
                                                  />
                                                </svg>
                                                Adding...
                                              </span>
                                            ) : (
                                              "Add"
                                            )}
                                          </Button>
                                        </div>

                                        <Title>List of Types</Title>

                                        <div className="overflow-y-auto  border rounded-md">
                                          <ul>
                                            {types.map((item, i) => (
                                              <li
                                                key={item.id}
                                                className={`flex items-center gap-3 px-3 py-2 ${i !== 0 ? "border-t" : ""
                                                  }`}
                                              >
                                                <span className="flex-1">
                                                  {item.name}
                                                </span>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => deleteType(item.id)}
                                                  disabled={typeDeletingId === item.id}
                                                >
                                                  {typeDeletingId === item.id ? (
                                                    <svg
                                                      className="animate-spin h-4 w-4 text-red-500"
                                                      viewBox="0 0 16 16"
                                                      fill="none"
                                                    >
                                                      <circle
                                                        className="opacity-25"
                                                        cx="8"
                                                        cy="8"
                                                        r="7"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                      />
                                                      <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z"
                                                      />
                                                    </svg>
                                                  ) : (
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                  )}
                                                </Button>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      <DialogFooter className="flex justify-between mt-[3rem]">
                                        <DialogClose asChild>
                                          <Button variant="outline">Close</Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                <Select
                                  value={type}
                                  onValueChange={setType}
                                  name="productTypeLabel"
                                >
                                  <SelectTrigger
                                    aria-labelledby="productTypeLabel"
                                    className="w-[12rem]"
                                  >
                                    <SelectValue placeholder="Select a Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {types.map((c) => (
                                      <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-2 w-[12rem] h-[5rem]">
                                <div className="flex justify-between">
                                  <Label
                                    id="productMaterialLabel"
                                    className="font-semibold cursor-pointer"
                                  >
                                    Product Material
                                  </Label>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline">Edit</Button>
                                    </DialogTrigger>
                                    <DialogContent aria-describedby={undefined} className="flex flex-col h-auto ">
                                      <DialogHeader>
                                        <DialogTitle>Material Name</DialogTitle>
                                        <DialogDescription>
                                          Make changes to your material here.
                                          Click save when you&apos;re done.
                                        </DialogDescription>
                                      </DialogHeader>

                                      <div className="h-[20rem] flex flex-col gap-5  ">

                                        <Label htmlFor="newMaterial">New Material</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            id="newMaterial"
                                            value={newMaterial}
                                            onChange={(e) =>
                                              setNewMaterial(e.target.value)
                                            }
                                            onKeyDown={(e) =>
                                              e.key === "Enter" && addMaterial()
                                            }
                                            placeholder="Add new material"
                                          />
                                          <Button
                                            type="button"
                                            onClick={addMaterial}
                                            disabled={materialAddLoading}
                                          >
                                            {materialAddLoading ? (
                                              <span className="flex items-center gap-2">
                                                <svg
                                                  className="animate-spin h-4 w-4 text-gray-500"
                                                  viewBox="0 0 16 16"
                                                  fill="none"
                                                >
                                                  <circle
                                                    className="opacity-25"
                                                    cx="8"
                                                    cy="8"
                                                    r="7"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                  />
                                                  <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z"
                                                  />
                                                </svg>
                                                Adding...
                                              </span>
                                            ) : (
                                              "Add"
                                            )}
                                          </Button>
                                        </div>

                                        <Title>List of Materials</Title>

                                        <div className="overflow-y-auto  border rounded-md">
                                          <ul>
                                            {materials.map((item, i) => (
                                              <li
                                                key={item.id}
                                                className={`flex items-center gap-3 px-3 py-2 ${i !== 0 ? "border-t" : ""
                                                  }`}
                                              >
                                                <span className="flex-1">
                                                  {item.name}
                                                </span>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => deleteMaterial(item.id)}
                                                  disabled={materialDeletingId === item.id}
                                                >
                                                  {materialDeletingId === item.id ? (
                                                    <svg
                                                      className="animate-spin h-4 w-4 text-red-500"
                                                      viewBox="0 0 16 16"
                                                      fill="none"
                                                    >
                                                      <circle
                                                        className="opacity-25"
                                                        cx="8"
                                                        cy="8"
                                                        r="7"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                      />
                                                      <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z"
                                                      />
                                                    </svg>
                                                  ) : (
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                  )}
                                                </Button>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      <DialogFooter className="flex justify-between mt-[3rem]">
                                        <DialogClose asChild>
                                          <Button variant="outline">Close</Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                <Select
                                  value={material}
                                  onValueChange={setMaterial}
                                  name="productMaterialLabel"
                                >
                                  <SelectTrigger
                                    aria-labelledby="productMaterialLabel"
                                    className="w-[12rem]"
                                  >
                                    <SelectValue placeholder="Select a Material" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materials.map((c) => (
                                      <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-2 w-[12rem] h-[5rem]">
                                <div className="flex justify-between">
                                  <Label
                                    id="productTagsLabel"
                                    className="font-semibold cursor-pointer"
                                  >
                                    Product Tags
                                  </Label>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline">Edit</Button>
                                    </DialogTrigger>

                                    <DialogContent aria-describedby={undefined} className="flex flex-col h-auto">
                                      <DialogHeader>
                                        <DialogTitle>Tags</DialogTitle>
                                        <DialogDescription>
                                          Add or remove tags. Newly added tags
                                          will be auto-selected.
                                        </DialogDescription>
                                      </DialogHeader>

                                      <div className="h-[20rem] flex flex-col gap-5">

                                        <Label htmlFor="newTag">Add New Tag</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            id="newTag"
                                            value={newTag}
                                            onChange={(e) =>
                                              setNewTag(e.target.value)
                                            }
                                            onKeyDown={(e) =>
                                              e.key === "Enter" && addTag()
                                            }
                                            placeholder="Add new tag"
                                          />
                                          <Button
                                            type="button"
                                            onClick={addTag}
                                            disabled={tagAddLoading}
                                          >
                                            {tagAddLoading ? (
                                              <span className="flex items-center gap-2">
                                                <svg
                                                  className="animate-spin h-4 w-4 text-gray-500"
                                                  viewBox="0 0 16 16"
                                                  fill="none"
                                                >
                                                  <circle
                                                    className="opacity-25"
                                                    cx="8"
                                                    cy="8"
                                                    r="7"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                  />
                                                  <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z"
                                                  />
                                                </svg>
                                                Adding...
                                              </span>
                                            ) : (
                                              "Add"
                                            )}
                                          </Button>
                                        </div>

                                        <DialogTitle>List of Tags</DialogTitle>
                                        <div className="overflow-y-auto border rounded-md">
                                          <ul>
                                            {tags.map((item, i) => (
                                              <li
                                                key={item.id}
                                                className={`flex items-center gap-3 px-3 py-2 ${i !== 0 ? "border-t" : ""
                                                  }`}
                                              >
                                                <span className="flex-1">
                                                  {item.name}
                                                </span>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => deleteTag(item.id)}
                                                  title="Delete tag"
                                                  disabled={tagDeletingId === item.id}
                                                >
                                                  {tagDeletingId === item.id ? (
                                                    <svg
                                                      className="animate-spin h-4 w-4 text-red-500"
                                                      viewBox="0 0 16 16"
                                                      fill="none"
                                                    >
                                                      <circle
                                                        className="opacity-25"
                                                        cx="8"
                                                        cy="8"
                                                        r="7"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                      />
                                                      <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z"
                                                      />
                                                    </svg>
                                                  ) : (
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                  )}
                                                </Button>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      <DialogFooter className="flex justify-between mt-[3rem]">
                                        <DialogClose asChild>
                                          <Button variant="outline">Close</Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>

                                <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[12rem] justify-between">
                                      {(() => {
                                        const selected = tags
                                          .filter((t) => selectedTags.includes(String(t.id)))
                                          .map((t) => t.name);

                                        if (selected.length === 0) return "Select tags";
                                        if (selected.length <= 2) return selected.join(", ");
                                        return `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`;
                                      })()}
                                    </Button>
                                  </PopoverTrigger>

                                  <PopoverContent
                                    className="z-[9999] w-[12rem] p-2 bg-white shadow-md border rounded-md"
                                    sideOffset={8}
                                    align="start"
                                    forceMount
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    onCloseAutoFocus={(e) => e.preventDefault()}
                                    style={{
                                      pointerEvents: "auto",
                                      zIndex: 9999,
                                    }}
                                  >
                                    {tags.length === 0 ? (
                                      <div className="text-sm text-muted-foreground">No tags found.</div>
                                    ) : (
                                      tags.map((t) => {
                                        const checked = selectedTags.includes(String(t.id));
                                        return (
                                          <div
                                            key={t.id}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                                            onClick={() => {
                                              console.log("Clicked tag:", t.id);
                                              toggleTag(t.id);
                                            }}
                                          >
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={() => toggleTag(t.id)}
                                            />
                                            <span>{t.name}</span>
                                          </div>
                                        );
                                      })
                                    )}
                                  </PopoverContent>
                                </Popover>



                              </div>

                              <div className="flex flex-col gap-2 w-[12rem] h-[5rem]">
                                <div className="flex justify-between">
                                  <Label
                                    id="productDescriptionLabel"
                                    className="font-semibold cursor-pointer"
                                  >
                                    Description
                                  </Label>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline">Edit</Button>
                                    </DialogTrigger>

                                    <DialogContent aria-describedby={undefined} className="flex flex-col h-auto">
                                      <DialogHeader>
                                        <DialogTitle>Descriptions</DialogTitle>
                                        <DialogDescription>
                                          Create reusable descriptions and link
                                          them by title.
                                        </DialogDescription>
                                      </DialogHeader>

                                      <div className="flex flex-col gap-3">
                                        <Label htmlFor="descriptionTitle">Title</Label>
                                        <Input
                                          id="descriptionTitle"
                                          value={descriptionTitle}
                                          onChange={(e) =>
                                            setDescriptionTitle(e.target.value)
                                          }
                                          placeholder="Description Title (e.g. 'Elevate Your Style')"
                                        />
                                        <Label htmlFor="descriptionBody">Body</Label>
                                        <Textarea
                                          id="descriptionBody"
                                          value={descriptionBody}
                                          onChange={(e) =>
                                            setDescriptionBody(e.target.value)
                                          }
                                          placeholder="Type description..."
                                          className="h-32 resize-none overflow-y-auto"
                                          style={{
                                            minHeight: "8rem",
                                            maxHeight: "8rem",
                                          }}
                                          maxLength={400}
                                        />

                                        {!editingDescriptionId ? (
                                          <div className="flex justify-end">
                                            <Button
                                              type="button"
                                              onClick={addDescription}
                                              disabled={descAddLoading}
                                            >
                                              {descAddLoading ? (
                                                <span className="flex items-center gap-2">
                                                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                    <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                    <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                  </svg>
                                                  Adding...
                                                </span>
                                              ) : "Add"}
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex justify-end gap-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={cancelEditingDescription}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              type="button"
                                              onClick={updateDescription}
                                              disabled={descUpdateLoading}
                                            >
                                              {descUpdateLoading ? (
                                                <span className="flex items-center gap-2">
                                                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                    <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                    <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                  </svg>
                                                  Updating...
                                                </span>
                                              ) : "Update"}
                                            </Button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-col gap-2">
                                        <DialogTitle>
                                          Saved Descriptions
                                        </DialogTitle>
                                        <div className="overflow-y-auto border rounded-md max-h-60">
                                          <ul>
                                            {descriptions.map((item, i) => (
                                              <li
                                                key={item.id}
                                                className={`px-3 py-2 ${i !== 0 ? "border-t" : ""
                                                  }`}
                                              >
                                                <div className="flex items-center gap-3">
                                                  <button
                                                    type="button"
                                                    className="flex-1 text-left hover:underline"
                                                    onClick={() =>
                                                      startEditingDescription(
                                                        item
                                                      )
                                                    }
                                                    title="Edit this description"
                                                  >
                                                    <div className="font-medium">
                                                      {item.title}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground line-clamp-2">
                                                      {item.body}
                                                    </div>
                                                  </button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteDescription(item.id)}
                                                    title="Delete"
                                                    disabled={descDeletingId === item.id}
                                                  >
                                                    {descDeletingId === item.id ? (
                                                      <svg className="animate-spin h-4 w-4 text-red-500" viewBox="0 0 16 16" fill="none">
                                                        <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                        <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                      </svg>
                                                    ) : (
                                                      <Trash2 className="h-4 w-4 text-red-500" />
                                                    )}
                                                  </Button>
                                                </div>
                                              </li>
                                            ))}
                                            {descriptions.length === 0 && (
                                              <li className="px-3 py-2 text-sm text-muted-foreground">
                                                No saved descriptions yet.
                                              </li>
                                            )}
                                          </ul>
                                        </div>
                                      </div>

                                      <DialogFooter className="flex justify-between mt-[1rem]">
                                        <DialogClose asChild>
                                          <Button variant="outline">Close</Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>

                                <Select
                                  value={selectedDescriptionId}
                                  onValueChange={(id) => {
                                    setSelectedDescriptionId(id);
                                    const found = descriptions.find(
                                      (d) => String(d.id) === String(id)
                                    );
                                    if (found) startEditingDescription(found);
                                  }}
                                  name="productDescriptionSelect"
                                >
                                  <SelectTrigger
                                    aria-labelledby="productDescriptionLabel"
                                    className="w-[12rem] truncate"
                                  >
                                    <SelectValue placeholder="Select a saved description" />
                                  </SelectTrigger>
                                  <SelectContent className="w-[12rem]">
                                    {descriptions.map((d) => {
                                      const label =
                                        `${d.title} – ${d.body}`.length > 40
                                          ? `${d.title} – ${d.body}`.slice(
                                            0,
                                            39
                                          ) + "…"
                                          : `${d.title} – ${d.body}`;
                                      return (
                                        <SelectItem
                                          key={d.id}
                                          value={String(d.id)}
                                        >
                                          <span className="block truncate">
                                            {label}
                                          </span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Care Guide */}
                              <div className="flex flex-col gap-2 w-[12rem] h-[5rem]">
                                <div className="flex justify-between">
                                  <Label id="productCareGuideLabel" className="font-semibold cursor-pointer">
                                    Care Guide
                                  </Label>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline">Edit</Button>
                                    </DialogTrigger>

                                    <DialogContent className="flex flex-col h-auto">
                                      <DialogHeader>
                                        <DialogTitle>Care Guides</DialogTitle>
                                        <DialogDescription>Create reusable care guides and link them by title.</DialogDescription>
                                      </DialogHeader>

                                      <div className="flex flex-col gap-3">
                                        <Label htmlFor="careTitle">Care Guide Title</Label>
                                        <Input
                                          id="careTitle"
                                          value={careTitle}
                                          onChange={(e) => setCareTitle(e.target.value)}
                                          placeholder="Care Guide Title (e.g. 'Care Instructions')"
                                        />
                                        <Label htmlFor="careBody">Instructions</Label>
                                        <Textarea
                                          id="careBody"
                                          value={careBody}
                                          onChange={(e) => setCareBody(e.target.value)}
                                          placeholder="Type care instructions..."
                                          className="h-32 resize-none overflow-y-auto"
                                          style={{ minHeight: "8rem", maxHeight: "8rem" }}
                                          maxLength={200}
                                        />

                                        {!editingCareId ? (
                                          <div className="flex justify-end">
                                            <Button
                                              type="button"
                                              onClick={addCareGuide}
                                              disabled={careAddLoading}
                                            >
                                              {careAddLoading ? (
                                                <span className="flex items-center gap-2">
                                                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                    <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                    <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                  </svg>
                                                  Adding...
                                                </span>
                                              ) : "Add"}
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={cancelEditingCare}>Cancel</Button>
                                            <Button
                                              type="button"
                                              onClick={updateCareGuide}
                                              disabled={careUpdateLoading}
                                            >
                                              {careUpdateLoading ? (
                                                <span className="flex items-center gap-2">
                                                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                    <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                    <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                  </svg>
                                                  Updating...
                                                </span>
                                              ) : "Update"}
                                            </Button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-col gap-2">
                                        <DialogTitle>Saved Care Guides</DialogTitle>
                                        <div className="overflow-y-auto border rounded-md max-h-60">
                                          <ul>
                                            {careGuides.map((item, i) => (
                                              <li key={item.id} className={`px-3 py-2 ${i !== 0 ? "border-t" : ""}`}>
                                                <div className="flex items-center gap-3">
                                                  <button
                                                    type="button"
                                                    className="flex-1 text-left hover:underline"
                                                    onClick={() => startEditingCare(item)}
                                                    title="Edit this care guide"
                                                  >
                                                    <div className="font-medium">{item.title}</div>
                                                    <div className="text-sm text-muted-foreground line-clamp-2">{item.body}</div>
                                                  </button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteCareGuide(item.id)}
                                                    title="Delete"
                                                    disabled={careDeletingId === item.id}
                                                  >
                                                    {careDeletingId === item.id ? (
                                                      <svg className="animate-spin h-4 w-4 text-red-500" viewBox="0 0 16 16" fill="none">
                                                        <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                        <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                      </svg>
                                                    ) : (
                                                      <Trash2 className="h-4 w-4 text-red-500" />
                                                    )}
                                                  </Button>
                                                </div>
                                              </li>
                                            ))}
                                            {careGuides.length === 0 && (
                                              <li className="px-3 py-2 text-sm text-muted-foreground">No saved care guides yet.</li>
                                            )}
                                          </ul>
                                        </div>
                                      </div>

                                      <DialogFooter className="flex justify-between mt-[1rem]">
                                        <DialogClose asChild>
                                          <Button variant="outline">Close</Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>

                                {/* Dropdown: select a saved care guide -> updates careGuideId */}
                                <Select
                                  value={careGuideId}
                                  onValueChange={(id) => {
                                    setCareGuideId(id);
                                    const found = careGuides.find((g) => String(g.id) === String(id));
                                    if (found) startEditingCare(found); // optional: enter edit mode
                                  }}
                                  name="productCareGuideSelect"
                                >
                                  <SelectTrigger aria-labelledby="productCareGuideLabel" className="w-[12rem] truncate">
                                    <SelectValue placeholder="Select a care guide" />
                                  </SelectTrigger>
                                  <SelectContent className="w-[auto]">
                                    {careGuides.map((g) => {
                                      const label =
                                        `${g.title} – ${g.body}`.length > 40
                                          ? `${g.title} – ${g.body}`.slice(0, 39) + "…"
                                          : `${g.title} – ${g.body}`;
                                      return (
                                        <SelectItem key={g.id} value={String(g.id)}>
                                          <span className="w-[12rem] truncate">{label}</span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* Size Guide (CRUD + select) */}
                              <div className="w-[12rem] flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <Label id="productSizeGuideLabel" className="font-semibold cursor-pointer">
                                    Size Guide
                                  </Label>

                                  <Dialog>
                                    <DialogTrigger asChild><Button variant="outline">Edit</Button></DialogTrigger>

                                    <DialogContent className="flex flex-col h-auto">
                                      <DialogHeader>
                                        <DialogTitle>Size Guides</DialogTitle>
                                        <DialogDescription>Upload and manage size guide images.</DialogDescription>
                                      </DialogHeader>

                                      <div className="flex flex-col gap-3">
                                        <Label htmlFor="sizeGuideTitle">Size Guide Title</Label>
                                        <Input
                                          id="sizeGuideTitle"
                                          value={sgTitle}
                                          onChange={(e) => setSgTitle(e.target.value)}
                                          placeholder="Size Guide Title (e.g. 'Tops Size Chart')"
                                        />
                                        <Label htmlFor="sizeGuideImage">Size Guide Image</Label>
                                        <Input
                                          id="sizeGuideImage"
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (!f) {
                                              setSgNewImage(null);
                                              setSgPreview("");
                                              return;
                                            }
                                            // Only accept actual image files
                                            if (!f.type.startsWith("image/")) {
                                              toast.error("Only image files are allowed.");
                                              e.target.value = ""; // reset file input
                                              setSgNewImage(null);
                                              setSgPreview("");
                                              return;
                                            }
                                            setSgNewImage(f);
                                            setSgPreview(URL.createObjectURL(f));
                                          }}
                                        />
                                        {sgPreview && (
                                          <img src={sgPreview} alt="preview" className="h-32 w-auto rounded border object-contain bg-white" />
                                        )}

                                        {!sgEditingId ? (
                                          <div className="flex justify-end">
                                            <Button
                                              type="button"
                                              onClick={addSizeGuide}
                                              disabled={sgAddLoading}
                                            >
                                              {sgAddLoading ? (
                                                <span className="flex items-center gap-2">
                                                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                    <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                    <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                  </svg>
                                                  Adding...
                                                </span>
                                              ) : "Add"}
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={cancelEditingSizeGuide}>Cancel</Button>
                                            <Button
                                              type="button"
                                              onClick={updateSizeGuide}
                                              disabled={sgUpdateLoading}
                                            >
                                              {sgUpdateLoading ? (
                                                <span className="flex items-center gap-2">
                                                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                    <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                    <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                  </svg>
                                                  Updating...
                                                </span>
                                              ) : "Update"}
                                            </Button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-col gap-2">
                                        <DialogTitle>Saved Size Guides</DialogTitle>
                                        <div className="overflow-y-auto border rounded-md max-h-60">
                                          <ul>
                                            {sizeGuides.map((g, i) => (
                                              <li key={g.id} className={`px-3 py-2 ${i !== 0 ? "border-t" : ""}`}>
                                                <div className="flex items-center gap-3">
                                                  <button
                                                    type="button"
                                                    className="flex-1 text-left hover:underline"
                                                    onClick={() => startEditingSizeGuide(g)}
                                                    title="Edit this size guide"
                                                  >
                                                    <div className="flex items-center gap-3">
                                                      <img
                                                        src={g.url}
                                                        alt={g.title || `Size Guide #${g.id}`}
                                                        className="h-12 w-auto rounded border object-contain bg-white"
                                                      />
                                                      <div>
                                                        <div className="font-medium">{g.title || `Size Guide #${g.id}`}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                          {g.width}×{g.height}px · {(g.bytes / 1024).toFixed(0)} KB
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteSizeGuide(g.id)}
                                                    title="Delete"
                                                    disabled={sgDeletingId === g.id}
                                                  >
                                                    {sgDeletingId === g.id ? (
                                                      <svg className="animate-spin h-4 w-4 text-red-500" viewBox="0 0 16 16" fill="none">
                                                        <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                        <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                      </svg>
                                                    ) : (
                                                      <Trash2 className="h-4 w-4 text-red-500" />
                                                    )}
                                                  </Button>
                                                </div>
                                              </li>
                                            ))}
                                            {sizeGuides.length === 0 && (
                                              <li className="px-3 py-2 text-sm text-muted-foreground">No size guides yet.</li>
                                            )}
                                          </ul>
                                        </div>
                                      </div>

                                      <DialogFooter className="flex justify-between mt-[1rem]">
                                        <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>

                                {/* Dropdown to select a saved Size Guide for this product */}
                                <Select value={sizeGuideId} onValueChange={setSizeGuideId} name="productSizeGuideSelect">
                                  <SelectTrigger aria-labelledby="productSizeGuideLabel" className="w-[auto] truncate">
                                    <SelectValue placeholder="Select a size guide" />
                                  </SelectTrigger>
                                  <SelectContent className="w-[12rem]">
                                    {sizeGuides.map((g) => (
                                      <SelectItem key={g.id} value={String(g.id)}>
                                        {g.title || `Size Guide #${g.id}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {/* {sizeGuideId && (() => {
                                          const sel = sizeGuides.find((s) => String(s.id) === String(sizeGuideId));
                                          return sel ? (
                                            <div className="mt-2">
                                              <img
                                                src={sel.url}
                                                alt={sel.title || `Size Guide #${sel.id}`}
                                                className="h-40 w-auto rounded border object-contain bg-white"
                                              />
                                            </div>
                                          ) : null;
                                        })()} */}
                              </div>
                            </section>
                          </ScrollArea>

                          <DialogFooter>
                            <DialogClose asChild>
                              <div className="flex gap-4 justify-end">
                                <Button>Close</Button>
                                <Button variant="outline" onClick={() => updateProductDetails(p)}>
                                  Update Details
                                </Button>
                              </div>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {/* <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the product. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProduct(p.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Yes, Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog> */}

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </div>
        {totalProductPages > 0 && (
          <div className="mt-4 flex justify-end">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setProductPage((prev) => Math.max(prev - 1, 1))}
                    className={productPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={productPage === page}
                      onClick={() => setProductPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setProductPage((prev) =>
                        Math.min(prev + 1, totalProductPages)
                      )
                    }
                    className={
                      productPage === totalProductPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

      </section>

      <section className="bg-white shadow-lg rounded-xl border border-gray-200 p-4   w-[100%] ">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Product Variants
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadProducts}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">

          {/* SKU Search */}
          <Input
            placeholder="Search by SKU"
            value={skuSearch}
            onChange={(e) => setSkuSearch(e.target.value)}
            className="w-full md:w-[13rem]"
          />

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[10rem]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Stock Sort */}
            <Select value={stockSort} onValueChange={setStockSort}>
              <SelectTrigger className="w-full md:w-[10rem]">
                <SelectValue placeholder="Sort by Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="asc">Stock Asc</SelectItem>
                <SelectItem value="desc">Stock Desc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full overflow-auto border rounded-md shadow-sm">
          <Table className="min-w-[800px] border-collapse">
            <TableCaption className="sr-only">
              {loadingProd
                ? "Loading variants…"
                : variantRows.length === 0
                  ? "No variants found."
                  : "All variants"}
            </TableCaption>
            <TableHeader className="sticky top-0 z-10 bg-[#E1E7E4]">
              <TableRow>
                <TableHead >Image</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Compare-Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Scarcity Stock</TableHead>
                <TableHead className="w-[12rem]">Status</TableHead>
                <TableHead className="w-[8rem]">Date Created</TableHead>
                <TableHead className="text-right w-[7rem]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!loadingProd && filteredVariants.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-6"
                  >
                    No variants found matching your search/filter.
                  </TableCell>
                </TableRow>
              )}
              {!loadingProd &&
                paginatedVariants.map((row) => {
                  const created = formatDate(row.createdAt);
                  return (
                    <TableRow
                      key={`${row.id}-${row.sku}`}
                      className="hover:bg-muted/40"
                    >
                      <TableCell>
                        <img
                          src={row.imageUrl || DEFAULT_VARIANT_IMG}
                          alt={row.sku || "Variant"}
                          className="h-10 w-10 object-cover rounded border"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{row.sku}</span>
                          <span className="text-xs text-muted-foreground">
                            {row.variantLabel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{fmtMoney(row.price)}</TableCell>
                      <TableCell>{fmtMoney(row.compareAt)}</TableCell>
                      <TableCell>{row.stock ?? "—"}</TableCell>
                      <TableCell>{row.scarcityStock ?? 0}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs border ${row.isActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                          >
                            {row.isActive ? "Active" : "Inactive"}
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={!!toggling[row.id]}
                                onClick={() => toggleVariantActive(row)}
                                className={toggling[row.id] ? "opacity-60 pointer-events-none" : ""}
                              >
                                {toggling[row.id] ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Updating…
                                  </span>
                                ) : row.isActive ? (
                                  "Set Inactive"
                                ) : (
                                  "Set Active"
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                      <TableCell>{created}</TableCell>

                      <TableCell className="text-right flex gap-2">
                        <Dialog onOpenChange={(open) => { if (open) loadVariantLogs(row.id); }}>
                          <DialogTrigger asChild>

                            <Button variant="outline">Edit</Button>


                          </DialogTrigger>
                          <DialogContent aria-describedby={undefined} className="flex flex-col ">
                            <DialogHeader>
                              <DialogTitle>
                                Product Variant: <span>{row.productName}</span>
                              </DialogTitle>
                              <DialogDescription>
                                SKU: <span>{row.sku}</span>
                              </DialogDescription>
                            </DialogHeader>

                            {(() => {
                              const d = getVariantDetails(row.id);


                              const { marginPct, profit } = computeMargin(
                                d.price,
                                d.costPerItem
                              );

                              return (

                                <main className="flex flex-col gap-3 overflow-y-scroll h-[20rem]">
                                  {/* IMAGES */}
                                  <section className="flex flex-col w-full border h-[15rem] justify-center p-2 gap-2">
                                    {(() => {
                                      const picked = getVariantImages(row.id);
                                      const hasPicked = picked.length > 0;

                                      const existing = getExistingImages(row.id); // saved minus deletions
                                      const existingMain = existing.find((i) => i?.is_main) || existing[0] || null;

                                      const mainUrl = hasPicked
                                        ? picked[0]?.url
                                        : existingMain
                                          ? toImageURL(existingMain)
                                          : "";

                                      // Build thumbs (exclude the displayed main)
                                      const pickedThumbs = hasPicked ? picked.slice(1, 5).map((p, i) => ({
                                        kind: "picked",
                                        url: p.url,
                                        index: i + 1,
                                      })) : [];

                                      const savedThumbs = !hasPicked
                                        ? existing
                                          .filter((im) => !existingMain || im.id !== existingMain.id)
                                          .slice(0, 4)
                                          .map((im) => ({
                                            kind: "saved",
                                            url: toImageURL(im),
                                            id: im.id,
                                          }))
                                        : [];

                                      const thumbs = hasPicked ? pickedThumbs : savedThumbs;

                                      const hasAny = hasPicked || existing.length > 0;
                                      return (
                                        <>
                                          <div className="flex w-full h-[10rem] gap-2">
                                            {/* Main image */}
                                            <div className="relative">
                                              <img
                                                src={mainUrl || DEFAULT_VARIANT_IMG}
                                                alt="Variant main"
                                                className="border rounded-lg h-[9rem] w-[10rem] object-cover bg-white"
                                              />
                                              {!hasAny && (
                                                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                                                  No image
                                                </div>
                                              )}
                                            </div>

                                            {/* Thumbnails */}
                                            <div className="flex h-full w-[15rem] flex-wrap gap-2">
                                              {thumbs.map((t) => (
                                                <div
                                                  key={`${t.kind}-${t.kind === "picked" ? t.index : t.id}`}
                                                  className="relative"
                                                >
                                                  <img
                                                    src={t.url || DEFAULT_VARIANT_IMG}
                                                    alt="Variant thumb"
                                                    className={`border rounded-lg h-[4rem] w-[5rem] object-cover ${t.kind === "picked" ? "cursor-pointer" : ""
                                                      }`}
                                                    title={t.kind === "picked" ? "Make main" : "Saved image"}
                                                    onClick={
                                                      t.kind === "picked"
                                                        ? () => makeMainVariantImage(row.id, t.index)
                                                        : undefined
                                                    }
                                                  />
                                                  {/* Remove buttons */}
                                                  {t.kind === "picked" ? (
                                                    <button
                                                      type="button"
                                                      className="absolute -top-1 -right-1 bg-white border rounded-full h-5 w-5 text-xs"
                                                      title="Remove"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeVariantImage(row.id, t.index);
                                                      }}
                                                    >
                                                      ×
                                                    </button>
                                                  ) : (
                                                    <button
                                                      type="button"
                                                      className="absolute -top-1 -right-1 bg-white border rounded-full h-5 w-5 text-xs"
                                                      title="Remove"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeSavedThumb(row.id, t.id); // mark for deletion
                                                      }}
                                                    >
                                                      ×
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                          {/* File picker */}
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                // Filter: only allow image files
                                                const imageFiles = files.filter(f => f.type.startsWith("image/"));
                                                if (imageFiles.length !== files.length) {
                                                  toast.error("Only image files are allowed. Non-image files were ignored.");
                                                }
                                                handleVariantFiles(row.id, imageFiles);
                                                e.target.value = ""; // allow re-picking same files
                                              }}
                                            />
                                            <div className="text-xs text-muted-foreground">
                                              {(getExistingImages(row.id).length + getVariantImages(row.id).length)}/{MAX_IMAGES_PER_VARIANT} images
                                            </div>
                                          </div>

                                          {/* Quick control: remove current main */}
                                          {(hasPicked || existing.length > 0) && (
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                className="text-xs underline"
                                                onClick={() => removeMainImage(row.id)}
                                              >
                                                Remove main image
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </section>

                                  {/* Price section */}

                                  <section className="border w-full h-[auto] p-2 flex flex-col gap-3">
                                    <h2>Price Details</h2>

                                    <div className="flex justify-center flex-wrap gap-3 p-2">
                                      <div className="w-[8rem] p-1 flex flex-col gap-2">
                                        <Label className="font-semibold">Price</Label>
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="\d*"
                                          placeholder="Price"
                                          value={d.price}
                                          onChange={(e) =>
                                            setVariantDetail(row.id, "price", e.target.value.replace(/[^\d]/g, ""))
                                          }
                                        />
                                      </div>
                                      <div className="w-[8rem] p-1 flex flex-col gap-2">
                                        <Label className="font-semibold">Compare at Price</Label>
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="\d*"
                                          placeholder="Compare"
                                          value={d.compareAt}
                                          onChange={(e) =>
                                            setVariantDetail(row.id, "compareAt", e.target.value.replace(/[^\d]/g, ""))
                                          }
                                        />
                                      </div>
                                      <div className="w-[8rem] p-1 flex flex-col gap-2">
                                        <Label className="font-semibold">Cost per Item</Label>
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="\d*"
                                          placeholder="Cost per Item"
                                          value={d.costPerItem}
                                          onChange={(e) =>
                                            setVariantDetail(row.id, "costPerItem", e.target.value.replace(/[^\d]/g, ""))
                                          }
                                        />
                                      </div>
                                    </div>


                                    <div className="flex justify-center flex-wrap gap-2">
                                      <div className="w-[12rem] bg-[#EAF8EE] rounded-lg p-3">
                                        <Label>Margin</Label>
                                        <h2>
                                          {marginPct == null
                                            ? "—"
                                            : `${marginPct.toFixed(1)}%`}
                                        </h2>
                                      </div>
                                      <div className="w-[12rem] bg-[#EAF8EE] rounded-lg p-3">
                                        <Label>Profit</Label>
                                        <h2>
                                          {profit == null ? "—" : `₱${profit.toFixed(2)}`}
                                        </h2>
                                      </div>
                                    </div>
                                  </section>

                                  <section className="border w-full h-[auto] p-2 flex flex-col gap-3">
                                    <div className="flex justify-between">
                                      <h2>Inventory Details</h2>

                                      <Dialog
                                        onOpenChange={(open) => {
                                          if (open) loadVariantLogs(row.id);
                                        }}
                                      >
                                        <DialogTrigger asChild>
                                          <Button variant="outline">Edit Stock</Button>
                                        </DialogTrigger>

                                        <DialogContent aria-describedby={undefined} className="w-[18rem]">
                                          <DialogHeader>
                                            <DialogTitle>Edit Stock</DialogTitle>
                                          </DialogHeader>

                                          <section className="flex flex-col items-center gap-4">
                                            <div className="w-full">
                                              <label className="block text-sm font-medium mb-1 text-center">Amount</label>
                                              <div className="flex items-center gap-2 justify-center">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="icon"
                                                  onClick={() => {
                                                    const d = getVariantDetails(row.id);
                                                    const n = Number(d.stockEdit || 0);
                                                    setVariantDetail(row.id, "stockEdit", String(n - 1));
                                                  }}
                                                >
                                                  -
                                                </Button>
                                                <Input
                                                  type="number"
                                                  value={getVariantDetails(row.id).stockEdit}
                                                  onChange={(e) => setVariantDetail(row.id, "stockEdit", e.target.value)}
                                                  className="text-center w-[6rem]"
                                                  placeholder="0"
                                                />
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="icon"
                                                  onClick={() => {
                                                    const d = getVariantDetails(row.id);
                                                    const n = Number(d.stockEdit || 0);
                                                    setVariantDetail(row.id, "stockEdit", String(n + 1));
                                                  }}
                                                >
                                                  +
                                                </Button>
                                              </div>
                                              <p className="text-xs text-muted-foreground text-center mt-1">
                                                Current: {row.stock ?? 0}
                                              </p>
                                            </div>

                                            <div className="w-full">
                                              <label className="block text-sm font-medium mb-1">Reason</label>
                                              <Select
                                                value={getVariantDetails(row.id).stockReason}
                                                onValueChange={(val) => setVariantDetail(row.id, "stockReason", val)}
                                                className="w-full"
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue placeholder="Select reason" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="Correction">Correction</SelectItem>
                                                  <SelectItem value="Damaged">Damaged</SelectItem>
                                                  <SelectItem value="Theft/lost">Theft/lost</SelectItem>
                                                  {/* <SelectItem value="Return restock">Return restock</SelectItem> */}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="w-full">
                                              <label className="block text-sm font-medium mb-1">Description/Notes</label>
                                              <Input
                                                type="text"
                                                value={getVariantDetails(row.id).stockDescription || ""}
                                                onChange={(e) => setVariantDetail(row.id, "stockDescription", e.target.value)}
                                                className="w-full"
                                                placeholder="Notes"
                                                required
                                                maxLength={100}
                                              />
                                            </div>
                                          </section>

                                          <DialogFooter className="flex justify-between mt-4">
                                            <DialogClose asChild>
                                              <Button variant="outline">Close</Button>
                                            </DialogClose>
                                            <Button
                                              variant="default"
                                              onClick={() => applyStockAdjustment(row)}
                                              disabled={
                                                stockEditLoading ||
                                                !getVariantDetails(row.id).stockReason ||
                                                !isNonZeroInt(getVariantDetails(row.id).stockEdit) ||
                                                !(getVariantDetails(row.id).stockDescription && getVariantDetails(row.id).stockDescription.trim())
                                              }
                                            >
                                              {stockEditLoading ? (
                                                <span className="inline-flex items-center gap-2">
                                                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                    <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                    <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                  </svg>
                                                  Saving...
                                                </span>
                                              ) : (
                                                "Save"
                                              )}
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>


                                    </div>

                                    <div className="flex justify-center gap-3 p-2">
                                      <div className="w-[6rem] flex flex-col gap-5">
                                        <Label
                                          htmlFor={`stock-`}
                                          className="font-semibold"
                                        >
                                          Stock
                                        </Label>

                                        <Label>{row.stock}</Label>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        <Label>Scarcity Stock</Label>
                                        <Input
                                          className="w-[7rem]"
                                          value={d.scarcityStock}
                                          onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d]/g, "");
                                            const parsed = Number(val);
                                            const stock = Number(row.stock ?? 0);

                                            // 🚫 Prevent if scarcity stock > stock
                                            if (parsed > stock) {
                                              toast.error("Scarcity stock cannot exceed available stock.");
                                              return;
                                            }

                                            setVariantDetail(row.id, "scarcityStock", val);
                                          }}
                                          placeholder="0"
                                          inputMode="numeric"
                                        />
                                      </div>
                                      <div className="w-[12rem] flex flex-col  gap-5">
                                        <Label>(SKU)</Label>
                                        <Label>{row.sku}</Label>
                                      </div>
                                    </div>
                                  </section>

                                  <section className="border w-full h-[20rem] p-2 flex flex-col gap-3">
                                    <h2>Adjustment History</h2>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Action</TableHead>
                                          <TableHead>Details</TableHead>
                                          <TableHead>Description</TableHead> {/* NEW COLUMN */}
                                          <TableHead>Accountable</TableHead>
                                          <TableHead>Date</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(() => {
                                          const items = getLogs(row.id);
                                          if (!items.length) {
                                            return (
                                              <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                  No adjustments yet.
                                                </TableCell>
                                              </TableRow>
                                            );
                                          }
                                          return items.map((lg) => (
                                            <TableRow key={lg.id}>
                                              <TableCell>{lg.reason || "—"}</TableCell>
                                              <TableCell>{formatLogDetails(lg)}</TableCell>
                                              <TableCell>{lg.description || "—"}</TableCell>
                                              <TableCell>{lg.performed_by_email || lg.accountable || "—"}</TableCell>
                                              <TableCell>{formatDate(lg.created_at)}</TableCell>
                                            </TableRow>
                                          ));
                                        })()}
                                      </TableBody>
                                    </Table>
                                  </section>

                                  <section className="w-full flex flex-col gap-2 ">
                                    <div className="flex items-center justify-between">
                                      <Label
                                        id="supplierLabel"
                                        className="font-semibold cursor-pointer"
                                      >
                                        Supplier
                                      </Label>

                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="outline">Edit</Button>
                                        </DialogTrigger>

                                        <DialogContent aria-describedby={undefined} className="flex flex-col h-[30rem] overflow-y-scroll">
                                          <DialogHeader>
                                            <DialogTitle>Suppliers</DialogTitle>
                                            <DialogDescription>
                                              Add or edit suppliers. Click a supplier
                                              to edit its details.
                                            </DialogDescription>
                                          </DialogHeader>

                                          {/* Form */}
                                          <div className="flex flex-col gap-3">
                                            <Input
                                              value={supplierName}
                                              onChange={(e) =>
                                                setSupplierName(e.target.value)
                                              }
                                              placeholder="Supplier name (e.g., ACME Trading)"
                                            />
                                            <Input
                                              value={supplierContactPerson}
                                              onChange={(e) =>
                                                setSupplierContactPerson(
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Contact person (e.g., Jane Doe)"
                                            />
                                            <Input
                                              value={supplierAddress}
                                              onChange={(e) =>
                                                setSupplierAddress(e.target.value)
                                              }
                                              placeholder="Address"
                                            />
                                            <Input
                                              value={supplierPhone}
                                              onChange={(e) =>
                                                setSupplierPhone(e.target.value)
                                              }
                                              placeholder="Contact number"
                                            />
                                            <Input
                                              value={supplierEmail}
                                              onChange={(e) =>
                                                setSupplierEmail(e.target.value)
                                              }
                                              placeholder="Email address"
                                              type="email"
                                            />

                                            {/* Add vs Update/Cancel */}
                                            {!editingSupplierId ? (
                                              <div className="flex justify-end">
                                                <Button
                                                  type="button"
                                                  onClick={addSupplier}
                                                  disabled={supplierAddLoading}
                                                >
                                                  {supplierAddLoading ? (
                                                    <span className="flex items-center gap-2">
                                                      <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                        <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                        <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                      </svg>
                                                      Adding...
                                                    </span>
                                                  ) : "Add"}
                                                </Button>
                                              </div>
                                            ) : (
                                              <div className="flex justify-end gap-2">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  onClick={cancelEditingSupplier}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  type="button"
                                                  onClick={updateSupplier}
                                                  disabled={supplierUpdateLoading}
                                                >
                                                  {supplierUpdateLoading ? (
                                                    <span className="flex items-center gap-2">
                                                      <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                        <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                        <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                      </svg>
                                                      Updating...
                                                    </span>
                                                  ) : "Update"}
                                                </Button>
                                              </div>
                                            )}
                                          </div>

                                          {/* List */}
                                          <div className="flex flex-col gap-2 mt-3">
                                            <DialogTitle>
                                              Existing Suppliers
                                            </DialogTitle>
                                            <div className="overflow-y-auto border rounded-md max-h-60">
                                              <ul>
                                                {suppliers.map((s, i) => (
                                                  <li
                                                    key={s.id}
                                                    className={`px-3 py-2 ${i !== 0 ? "border-t" : ""
                                                      }`}
                                                  >
                                                    <div className="flex items-center gap-3">
                                                      <button
                                                        type="button"
                                                        className="flex-1 text-left hover:underline"
                                                        onClick={() =>
                                                          startEditingSupplier(s)
                                                        }
                                                        title="Edit this supplier"
                                                      >
                                                        <div className="font-medium">
                                                          {s.name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground line-clamp-2">
                                                          {s.contactPerson
                                                            ? `${s.contactPerson} • `
                                                            : ""}
                                                          {s.phone
                                                            ? `${s.phone} • `
                                                            : ""}
                                                          {s.email || "—"}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground line-clamp-1">
                                                          {s.address || ""}
                                                        </div>
                                                      </button>
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteSupplier(s.id)}
                                                        title="Delete"
                                                        disabled={supplierDeletingId === s.id}
                                                      >
                                                        {supplierDeletingId === s.id ? (
                                                          <svg className="animate-spin h-4 w-4 text-red-500" viewBox="0 0 16 16" fill="none">
                                                            <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                            <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                          </svg>
                                                        ) : (
                                                          <Trash2 className="h-4 w-4 text-red-500" />
                                                        )}
                                                      </Button>
                                                    </div>
                                                  </li>
                                                ))}
                                                {suppliers.length === 0 && (
                                                  <li className="px-3 py-2 text-sm text-muted-foreground">
                                                    No suppliers yet.
                                                  </li>
                                                )}
                                              </ul>
                                            </div>
                                          </div>

                                          <DialogFooter className="flex justify-between mt-[1rem]">
                                            <DialogClose asChild>
                                              <Button
                                                variant="outline"
                                                onClick={cancelEditingSupplier}
                                              >
                                                Close
                                              </Button>
                                            </DialogClose>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>

                                    <Select
                                      value={d.supplierId}
                                      onValueChange={(id) =>
                                        setVariantDetail(row.id, "supplierId", id)
                                      }
                                      name={`supplierId_${row.id}`}
                                    >
                                      <SelectTrigger
                                        aria-labelledby="supplierLabel"
                                        className="w-full truncate"
                                      >
                                        <SelectValue placeholder="Select a supplier" />
                                      </SelectTrigger>
                                      <SelectContent className="w-full">
                                        {suppliers.map((s) => {
                                          const label = `${s.name}${s.contactPerson ? " – " + s.contactPerson : ""
                                            }`;
                                          return (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                              <span className="block truncate">{label}</span>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </section>

                                  <section className="w-full flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <Label
                                        id="shipmentLabel"
                                        className="font-semibold cursor-pointer"
                                      >
                                        Shipment Details
                                      </Label>

                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="outline">Edit</Button>
                                        </DialogTrigger>

                                        <DialogContent aria-describedby={undefined} className="flex flex-col h-[30rem] overflow-y-scroll">
                                          <DialogHeader>
                                            <DialogTitle>
                                              Shipment Presets
                                            </DialogTitle>
                                            <DialogDescription>
                                              Create or edit package presets. Select a
                                              preset for this product below.
                                            </DialogDescription>
                                          </DialogHeader>

                                          {/* Form */}
                                          <div className="flex flex-col gap-3">
                                            {/* Fixed package type select */}
                                            <Select
                                              value={packageType}
                                              onValueChange={setPackageType}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select package type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {PACKAGE_TYPES.map((t) => (
                                                  <SelectItem key={t} value={t}>
                                                    {t}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>

                                            <div className="grid grid-cols-2 gap-2">
                                              <div className="flex flex-col gap-1">
                                                <Label htmlFor="weightKg">
                                                  Weight (kg)
                                                </Label>
                                                <Input
                                                  id="weightKg"
                                                  value={weightKg}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^\d*\.?\d*$/.test(val)) {
                                                      setWeightKg(val);
                                                    }
                                                  }}
                                                  placeholder="Weight (kg)"
                                                  inputMode="decimal"
                                                />
                                              </div>

                                              <div className="flex flex-col gap-1">
                                                <Label htmlFor="lengthCm">
                                                  Length (cm)
                                                </Label>
                                                <Input
                                                  id="lengthCm"
                                                  value={lengthCm}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^\d*\.?\d*$/.test(val)) {
                                                      setLengthCm(val);
                                                    }
                                                  }}
                                                  placeholder="Length (cm)"
                                                  inputMode="decimal"
                                                />
                                              </div>

                                              <div className="flex flex-col gap-1">
                                                <Label htmlFor="widthCm">
                                                  Width (cm)
                                                </Label>
                                                <Input
                                                  id="widthCm"
                                                  value={widthCm}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^\d*\.?\d*$/.test(val)) {
                                                      setWidthCm(val);
                                                    }
                                                  }}
                                                  placeholder="Width (cm)"
                                                  inputMode="decimal"
                                                />
                                              </div>

                                              <div className="flex flex-col gap-1">
                                                <Label htmlFor="heightCm">
                                                  Height (cm)
                                                </Label>
                                                <Input
                                                  id="heightCm"
                                                  value={heightCm}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^\d*\.?\d*$/.test(val)) {
                                                      setHeightCm(val);
                                                    }
                                                  }}
                                                  placeholder="Height (cm)"
                                                  inputMode="decimal"
                                                />
                                              </div>
                                            </div>

                                            {/* Add vs Update/Cancel */}
                                            {!editingShipmentId ? (
                                              <div className="flex justify-end">
                                                <Button
                                                  type="button"
                                                  onClick={addShipment}
                                                  disabled={shipmentAddLoading}
                                                >
                                                  {shipmentAddLoading ? (
                                                    <span className="flex items-center gap-2">
                                                      <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                        <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                        <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                      </svg>
                                                      Adding...
                                                    </span>
                                                  ) : "Add"}
                                                </Button>
                                              </div>
                                            ) : (
                                              <div className="flex justify-end gap-2">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  onClick={cancelEditingShipment}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  type="button"
                                                  onClick={updateShipment}
                                                  disabled={shipmentUpdateLoading}
                                                >
                                                  {shipmentUpdateLoading ? (
                                                    <span className="flex items-center gap-2">
                                                      <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                                                        <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                        <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                      </svg>
                                                      Updating...
                                                    </span>
                                                  ) : "Update"}
                                                </Button>
                                              </div>
                                            )}
                                          </div>

                                          {/* List */}
                                          <div className="flex flex-col gap-2 mt-3">
                                            <DialogTitle>
                                              Existing Presets
                                            </DialogTitle>
                                            <div className="overflow-y-auto border rounded-md max-h-60">
                                              <ul>
                                                {shipments.map((s, i) => (
                                                  <li
                                                    key={s.id}
                                                    className={`px-3 py-2 ${i !== 0 ? "border-t" : ""
                                                      }`}
                                                  >
                                                    <div className="flex items-center gap-3">
                                                      <button
                                                        type="button"
                                                        className="flex-1 text-left hover:underline"
                                                        onClick={() =>
                                                          startEditingShipment(s)
                                                        }
                                                        title="Edit this preset"
                                                      >
                                                        <div className="font-medium">
                                                          {s.packageType} •{" "}
                                                          {s.weightKg} kg
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                          {s.lengthCm} × {s.widthCm} ×{" "}
                                                          {s.heightCm} cm
                                                        </div>
                                                      </button>
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteShipment(s.id)}
                                                        title="Delete"
                                                        disabled={shipmentDeletingId === s.id}
                                                      >
                                                        {shipmentDeletingId === s.id ? (
                                                          <svg className="animate-spin h-4 w-4 text-red-500" viewBox="0 0 16 16" fill="none">
                                                            <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                            <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                          </svg>
                                                        ) : (
                                                          <Trash2 className="h-4 w-4 text-red-500" />
                                                        )}
                                                      </Button>
                                                    </div>
                                                  </li>
                                                ))}
                                                {shipments.length === 0 && (
                                                  <li className="px-3 py-2 text-sm text-muted-foreground">
                                                    No shipment presets yet.
                                                  </li>
                                                )}
                                              </ul>
                                            </div>
                                          </div>

                                          <DialogFooter className="flex justify-between mt-[1rem]">
                                            <DialogClose asChild>
                                              <Button
                                                variant="outline"
                                                onClick={cancelEditingShipment}
                                              >
                                                Close
                                              </Button>
                                            </DialogClose>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>

                                    <Select
                                      value={d.shipmentId}
                                      onValueChange={(id) =>
                                        setVariantDetail(row.id, "shipmentId", id)
                                      }
                                      name={`shipmentId_${row.id}`}
                                    >
                                      <SelectTrigger
                                        aria-labelledby="shipmentLabel"
                                        className="w-full truncate"
                                      >
                                        <SelectValue placeholder="Select a shipment preset" />
                                      </SelectTrigger>
                                      <SelectContent className="w-full">
                                        {shipments.map((s) => {
                                          const label = `${s.packageType} • ${s.weightKg}kg • ${s.lengthCm}×${s.widthCm}×${s.heightCm}cm`;
                                          return (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                              <span className="block truncate">{label}</span>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </section>
                                </main>
                              );
                            })()}

                            <DialogFooter className="flex justify-between mt-[1rem]">
                              {/* Close without saving */}
                              <DialogClose asChild>
                                <Button>Close</Button>
                              </DialogClose>

                              {/* Save updates (only changed fields sent) */}
                              <Button
                                variant="outline"
                                disabled={!!saving[row.id]}
                                onClick={() => updateVariant(row)}
                              >
                                {saving[row.id] ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating…
                                  </span>
                                ) : (
                                  "Update"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        {/* ✅ Restock Dialog */}
                        <Dialog
                          onOpenChange={(open) => {
                            if (open) {

                              // Reset and optionally prefill only on open
                              setRestockAmount("");
                              setRestockPrice("");
                              setRestockCost("");
                              setRestockScarcity("");
                            } else {

                              setRestockAmount("");
                              setRestockPrice("");
                              setRestockCost("");
                              setRestockScarcity("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Restock</Button>
                          </DialogTrigger>

                          <DialogContent aria-describedby={undefined} className="sm:max-w-[480px]">
                            <DialogHeader>
                              <DialogTitle>Create New Batch</DialogTitle>
                              <DialogDescription>
                                Generate a new batch for: <strong>{row.sku}</strong>
                              </DialogDescription>
                            </DialogHeader>

                            <div className="text-sm text-muted-foreground pb-2">
                              Current batch: <strong>B{row.batchNo}</strong> → New batch: <strong>B{getNextBatchNumber(row)}</strong>
                            </div>

                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-2">
                                <Label>Stock Quantity</Label>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  placeholder="Stock Amount"
                                  value={restockAmount}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d]/g, "");
                                    setRestockAmount(value);
                                  }}
                                  disabled={restockLoading}
                                />
                                {restockAmount !== "" && !isInt(restockAmount) && (
                                  <p className="text-sm text-red-500">Stock must be an integer.</p>
                                )}
                                {restockAmount !== "" && isInt(restockAmount) && Number(restockAmount) <= 0 && (
                                  <p className="text-sm text-red-500">Stock must be a positive integer.</p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <Label>Price</Label>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min={0.01}
                                  placeholder="Price"
                                  value={restockPrice}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9.]/g, "");
                                    setRestockPrice(value);
                                  }}
                                  disabled={restockLoading}
                                />
                                {restockPrice !== "" && !isDecimal(restockPrice) && (
                                  <p className="text-sm text-red-500">Price must be a number.</p>
                                )}
                                {restockPrice !== "" && isDecimal(restockPrice) && Number(restockPrice) <= 0 && (
                                  <p className="text-sm text-red-500">Price must be a positive number.</p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <Label>Cost per Item</Label>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min={0.01}
                                  placeholder="Cost per Item"
                                  value={restockCost}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9.]/g, "");
                                    setRestockCost(value);
                                  }}
                                  disabled={restockLoading}
                                />
                                {restockCost !== "" && !isDecimal(restockCost) && (
                                  <p className="text-sm text-red-500">Cost per item must be a number.</p>
                                )}
                                {restockCost !== "" && isDecimal(restockCost) && Number(restockCost) <= 0 && (
                                  <p className="text-sm text-red-500">Cost per item must be a positive number.</p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <Label>Scarcity Stock</Label>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  placeholder="Scarcity Stock"
                                  value={restockScarcity}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d]/g, "");
                                    setRestockScarcity(value);
                                  }}
                                  disabled={restockLoading}
                                />
                                {restockScarcity !== "" && !isInt(restockScarcity) && (
                                  <p className="text-sm text-red-500">Scarcity stock must be an integer.</p>
                                )}
                                {restockScarcity !== "" && isInt(restockScarcity) && Number(restockScarcity) < 0 && (
                                  <p className="text-sm text-red-500">Scarcity stock cannot be negative.</p>
                                )}
                                {restockScarcity !== "" && isInt(restockScarcity) && Number(restockScarcity) > Number(restockAmount) && (
                                  <p className="text-sm text-red-500">Scarcity stock must not exceed stock.</p>
                                )}
                              </div>
                            </div>

                            <DialogFooter className="pt-4">
                              <DialogClose asChild>
                                <Button variant="outline" disabled={restockLoading}>Cancel</Button>
                              </DialogClose>
                              <Button
                                onClick={() => handleRestock(row)}
                                disabled={
                                  restockLoading ||
                                  !restockAmount ||
                                  !isInt(restockAmount) ||
                                  Number(restockAmount) <= 0 ||
                                  !restockPrice ||
                                  !isDecimal(restockPrice) ||
                                  Number(restockPrice) <= 0 ||
                                  !restockCost ||
                                  !isDecimal(restockCost) ||
                                  Number(restockCost) <= 0 ||
                                  (restockScarcity !== "" && (!isInt(restockScarcity) || Number(restockScarcity) < 0 || Number(restockScarcity) > Number(restockAmount)))
                                }
                              >
                                {restockLoading ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" /> Creating...
                                  </span>
                                ) : (
                                  "Create New Batch"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>


        </div>

        {/* Pagination for variants controls */}

        {totalVariantPages > 0 && (

          <div className="mt-4 flex justify-end">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setVariantPage((prev) => Math.max(prev - 1, 1))}
                    className={variantPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalVariantPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={variantPage === pageNum}
                      onClick={() => setVariantPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setVariantPage((prev) => Math.min(prev + 1, totalVariantPages))
                    }
                    className={
                      variantPage === totalVariantPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

        )}


      </section>
    </main >
  );
};
