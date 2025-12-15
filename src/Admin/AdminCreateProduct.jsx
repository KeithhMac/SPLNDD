import React from "react";
import { useState, useEffect, useMemo, useContext } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { AdminAuthContext } from "@/context/AdminAuthContext.jsx";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Title } from "@radix-ui/react-dialog";

import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"; // ✅ import toast
import api from "../api/axios.js";
import { compressImage } from "@/utils/compressImage.js";
import DEFAULT_VARIANT_IMG from "../Images/Default-Variant-Image.jpg";
import { Skeleton } from "@/components/ui/skeleton.jsx";

export const AdminCreateProduct = () => {

  const { admin } = useContext(AdminAuthContext);

  const [loading, setLoading] = useState(false);

  const [showSkeleton, setShowSkeleton] = useState(true);



  const [productName, setProductName] = useState("");
  // selected values
  const [categories, setCategories] = useState([]); // [{id, name}, ...]
  const [category, setCategory] = useState(""); // selected category id (string)

  const canConfigureVariants =
    productName.trim().length > 0 && String(category).trim() !== "";

  const [variantDetails, setVariantDetails] = useState({});

  console.log(variantDetails);

  const getVariantDetails = (variantId) =>
    variantDetails[String(variantId)] || {
      price: "",
      compareAt: "",
      costPerItem: "",
      stock: "",
      supplierId: "",
      shipmentId: "",
    };

  const setVariantDetail = (variantId, key, value) => {
    setVariantDetails((prev) => ({
      ...prev,
      [String(variantId)]: {
        ...getVariantDetails(variantId),
        [key]: value,
      },
    }));
  };

  const toNum = (v) => {
    if (v === "" || v == null) return NaN;
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };

  const computeMarginPct = (price, cost) => {
    const p = toNum(price);
    const c = toNum(cost);
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(c)) return "0.00";
    return (((p - c) / p) * 100).toFixed(2);
  };

  // ✅ Profit per item (NOT multiplied by stock)
  const computeProfitPerItem = (price, cost) => {
    const p = toNum(price);
    const c = toNum(cost);
    if (!Number.isFinite(p) || !Number.isFinite(c)) return "0.00";
    return (p - c).toFixed(2);
  };


  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/admin/manage-products/categories")
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
    setSelectedTags((prev) => {
      const key = String(id);
      return prev.includes(key)
        ? prev.filter((x) => x !== key)
        : [...prev, key];
    });
  };

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


  // size guide (single image, required)
  const [sizeGuides, setSizeGuides] = useState([]);
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



  // Options CRUD
  const [options, setOptions] = useState([]); // [{id, name, values:[{id, name}]}]
  const [optionAddLoading, setOptionAddLoading] = useState(false);
  const [optionUpdateLoading, setOptionUpdateLoading] = useState(false);
  const [optionDeletingId, setOptionDeletingId] = useState(null);

  // Selection: map of optionId -> array of valueIds
  const [selectedOptionValues, setSelectedOptionValues] = useState({});
  // e.g. { "1": ["11","12"], "2": ["21"] }

  // Draft/editing in dialog
  const [editingOptionId, setEditingOptionId] = useState(""); // "" => add mode
  const [optionName, setOptionName] = useState("");
  const [draftValue, setDraftValue] = useState(""); // input for a single value
  const [draftValues, setDraftValues] = useState([]); // ["Red","Blue",...]

  const [valueAddLoading, setValueAddLoading] = useState(false);
  const [removingDraftValue, setRemovingDraftValue] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await api.get("/admin/manage-products/options");
        // expect: [{id, name, values:[{id, name}]}]
        setOptions(res.data);
      } catch (err) {
        toast.error("Failed to load options");
        console.error(err);
      }
    };
    loadOptions();
  }, []);

  const saveOptionToDb = async ({ name, values }) => {
    // values: ["Red","Blue"] (strings)
    try {
      const res = await api.post("/admin/manage-products/options", { name, values });
      return res.data.option; // {id, name, values:[{id,name}]}
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Option already exists");
      } else {
        toast.error(err.response?.data?.error || "❌ Failed to add option");
      }
      return false;
    }
  };

  const updateOptionToDb = async (id, { name, values }) => {
    try {
      const res = await api.patch(`/admin/manage-products/options/${id}`, {
        name,
        values,
      });
      return res.data.option; // {id, name, values:[{id,name}]}
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Option name already exists");
      } else {
        toast.error(err.response?.data?.error || "❌ Failed to update option");
      }
      return false;
    }
  };

  const deleteOption = async (id) => {
    setOptionDeletingId(id);
    try {
      const res = await api.delete(`/admin/manage-products/options/${id}`);
      toast.success(res.data.message);
      setOptions((prev) => prev.filter((o) => String(o.id) !== String(id)));
      setSelectedOptionValues((prev) => {
        const copy = { ...prev };
        delete copy[String(id)];
        return copy;
      });
      setSelectedOptionOrder((prev) => prev.filter((x) => x !== String(id)));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete option");
    } finally {
      setOptionDeletingId(null);
    }
  };

  const resetDialog = () => {
    setEditingOptionId("");
    setOptionName("");
    setDraftValue("");
    setDraftValues([]);
  };

  const startEditingOption = (opt) => {
    setEditingOptionId(String(opt.id));
    setOptionName(opt.name);
    setDraftValues(opt.values?.map((v) => v.name) || []);
  };

  const addDraftValue = async () => {
    const v = draftValue.trim();
    if (!v || valueAddLoading) return;
    const exists = draftValues.some((x) => x.toLowerCase() === v.toLowerCase());
    if (exists) {
      toast.error("Value already added");
      return;
    }

    setValueAddLoading(true);
    setTimeout(() => { // simulate async if needed
      setDraftValues((prev) => [...prev, v]);
      setDraftValue("");
      setValueAddLoading(false);
    }, 500); // remove or adjust for real async
  };

  const removeDraftValue = async (name) => {
    if (removingDraftValue) return; // prevent double click
    setRemovingDraftValue(name);
    setTimeout(() => { // simulate async, replace with real call if needed
      setDraftValues((prev) => prev.filter((v) => v !== name));
      setRemovingDraftValue("");
    }, 400); // 400ms spinner for UX; remove if not needed
  };

  const addOption = async () => {
    const n = optionName.trim();
    if (!n) return toast.error("Option name is required");
    if (draftValues.length === 0) return toast.error("Add at least one value");
    if (optionAddLoading) return;

    // local duplicate name check
    if (options.some((o) => o.name.toLowerCase() === n.toLowerCase())) {
      return toast.error("Option already exists");
    }

    setOptionAddLoading(true);
    try {
      const created = await saveOptionToDb({ name: n, values: draftValues });
      if (created) {
        setOptions((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success("Option added");
        resetDialog();
      }
    } finally {
      setOptionAddLoading(false);
    }
  };

  const updateOption = async () => {
    if (!editingOptionId) return;
    const n = optionName.trim();
    if (!n) return toast.error("Option name is required");
    if (draftValues.length === 0) return toast.error("Add at least one value");
    if (optionUpdateLoading) return;

    // local duplicate check vs others
    if (
      options.some(
        (o) =>
          o.name.toLowerCase() === n.toLowerCase() &&
          String(o.id) !== String(editingOptionId)
      )
    ) {
      return toast.error("Another option already has this name");
    }

    setOptionUpdateLoading(true);
    try {
      const updated = await updateOptionToDb(editingOptionId, {
        name: n,
        values: draftValues,
      });
      if (updated) {
        setOptions((prev) =>
          prev
            .map((o) => (String(o.id) === String(updated.id) ? updated : o))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setSelectedOptionValues((prev) => {
          const kept = { ...prev };
          const optId = String(updated.id);
          const validIds = new Set(updated.values.map((v) => String(v.id)));
          if (kept[optId]) {
            kept[optId] = kept[optId].filter((vid) => validIds.has(String(vid)));
          }
          const hasAny = (kept[optId]?.length ?? 0) > 0;
          setSelectedOptionOrder((prevOrder) =>
            hasAny ? prevOrder : prevOrder.filter((id) => id !== optId)
          );
          return kept;
        });
        toast.success("Option updated");
        resetDialog();
      }
    } finally {
      setOptionUpdateLoading(false);
    }
  };

  const [selectedOptionOrder, setSelectedOptionOrder] = useState([]);
  // Example: ["2", "1", "3"] means size selected first, then color, then material

  const toggleOptionValue = (optionId, valueId) => {
    const oKey = String(optionId);
    const vKey = String(valueId);
    setSelectedOptionValues((prev) => {
      const curr = prev[oKey] || [];
      const nextVals = curr.includes(vKey)
        ? curr.filter((x) => x !== vKey)
        : [...curr, vKey];

      // Update order separately
      setSelectedOptionOrder((prevOrder) => {
        if (nextVals.length > 0 && !prevOrder.includes(oKey)) {
          return [...prevOrder, oKey];
        }
        if (nextVals.length === 0) {
          return prevOrder.filter((id) => id !== oKey);
        }
        return prevOrder;
      });

      return { ...prev, [oKey]: nextVals };
    });
  };

  const slug = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  function generateVariants() {
    if (!productName || !category || selectedOptionOrder.length === 0) return [];

    // selected category name ('' if not found)
    const catName =
      categories.find((c) => String(c.id) === String(category))?.name || "";

    // base prefix: ProductName then Category
    const skuBase = [slug(productName), slug(catName)].filter(Boolean).join("-");

    // Build arrays of selected values as { id, name }
    const arrays = selectedOptionOrder.map((optId) => {
      const opt = options.find((o) => String(o.id) === String(optId));
      if (!opt) return [];
      const selectedIds = selectedOptionValues[optId] || [];
      return selectedIds
        .map((valId) => {
          const val = opt.values.find((v) => String(v.id) === String(valId));
          return val ? { id: String(val.id), name: val.name } : null;
        })
        .filter(Boolean);
    });

    if (arrays.some((arr) => arr.length === 0)) return [];

    const cartesian = arrays.reduce(
      (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
      [[]]
    );

    return cartesian.map((combo) => {
      const valueIds = combo.map((x) => x.id);
      const valueSlugs = combo.map((x) => slug(x.name));
      const id = valueIds.join("__");

      // SKU: ProductName – Category – values – B1
      const sku = [skuBase, ...valueSlugs, "B1"].filter(Boolean).join("-");

      return { id, sku, valueIds, labels: combo.map((x) => x.name) };
    });
  }

  const variants = useMemo(generateVariants, [
    productName,
    category,      // ✅ added
    categories,    // ✅ added (used to resolve category name)
    selectedOptionOrder,
    selectedOptionValues,
    options,
  ]);

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

  // Store images per variant: { [variantId]: Array<{ file: File, url: string }> }
  const [variantImagesMap, setVariantImagesMap] = useState({});
  // Variant image actions (example for remove)
  const [variantImageRemoving, setVariantImageRemoving] = useState({});

  // Get images for a variant
  const getVariantImages = (variantId) =>
    variantImagesMap[String(variantId)] || [];

  // Set images for a variant
  const setVariantImages = (variantId, images) =>
    setVariantImagesMap((prev) => ({ ...prev, [String(variantId)]: images }));

  // Add selected files (enforce max 5, images only)
  const handleVariantFiles = (variantId, fileList) => {
    const prev = getVariantImages(variantId);
    const incoming = Array.from(fileList || []);
    const imgs = [];

    for (const f of incoming) {
      if (!f.type?.startsWith?.("image/")) continue;
      imgs.push({ file: f, url: URL.createObjectURL(f) });
    }

    const next = [...prev, ...imgs].slice(0, 5); // cap to 5
    if (prev.length + imgs.length > 5) {
      toast.error("Max 5 images per variant");
    }
    setVariantImages(variantId, next);
  };

  // Make clicked thumbnail the main (move to index 0)
  const makeMainVariantImage = (variantId, index) => {
    const arr = [...getVariantImages(variantId)];
    if (index < 0 || index >= arr.length) return;
    const [picked] = arr.splice(index, 1);
    const next = [picked, ...arr];
    setVariantImages(variantId, next);
  };

  // Remove image (and revoke URL)
  const removeVariantImage = (variantId, index) => {
    setVariantImageRemoving((prev) => ({
      ...prev,
      [variantId]: index,
    }));
    setTimeout(() => {
      const arr = [...getVariantImages(variantId)];
      if (!arr[index]) return;
      URL.revokeObjectURL(arr[index].url);
      arr.splice(index, 1);
      setVariantImages(variantId, arr);
      setVariantImageRemoving((prev) => ({
        ...prev,
        [variantId]: null,
      }));
    }, 400); // simulate async, adjust as needed
  };

  const [isInserting, setIsInserting] = useState(false);

  const handleInsertProduct = async () => {
    // product-level validations only
    if (!productName.trim()) return toast.error("Product name is required");
    if (!category) return toast.error("Category is required");
    if (!type) return toast.error("Type is required");
    if (!material) return toast.error("Material is required");
    if (selectedTags.length === 0)
      return toast.error("Select at least one tag");
    if (!selectedDescriptionId) return toast.error("Description is required");

    if (!sizeGuideId) return toast.error("Size Guide is required");
    if (!careGuideId) return toast.error("Care Guide is required");

    if (variants.length === 0) {
      return toast.error("Create at least one variant from options");
    }
    for (const v of variants) {
      const d = getVariantDetails(v.id);

      // Check images
      const images = getVariantImages(v.id);
      if (!images || images.length === 0) {
        setIsInserting(false);
        return toast.error(`At least one image is required for ${v.sku}`);
      }

      // Check price
      if (!d.price) {
        setIsInserting(false);
        return toast.error(`Price is required for ${v.sku}`);
      }

      // Check cost per item
      if (!d.costPerItem) {
        setIsInserting(false);
        return toast.error(`Cost per item is required for  ${v.sku}`);
      }

      // Check stock
      if (!d.stock) {
        setIsInserting(false);
        return toast.error(`Stock is required for  ${v.sku}`);
      }

      // Check supplier
      if (!d.supplierId) {
        setIsInserting(false);
        return toast.error(`Supplier is required for ${v.sku}`);
      }

      // Check shipment
      if (!d.shipmentId) {
        setIsInserting(false);
        return toast.error(`Shipment is required for ${v.sku}`);
      }
    }

    setIsInserting(true); // disable button here

    // build variants payload (IDs, not names) — include ALL displayed variants
    const variantPayloads = variants.map((v, idx) => {
      const d = getVariantDetails(v.id);
      const num = (x) => (x === "" || x == null ? undefined : Number(x));
      return {
        sku: v.sku,
        optionValueIds: v.valueIds.map((x) => Number(x)), // <-- IDs for backend
        price: num(d.price),
        compareAt: num(d.compareAt),
        costPerItem: num(d.costPerItem),
        stock: num(d.stock),
        supplierId: d.supplierId ? Number(d.supplierId) : undefined,
        shipmentId: d.shipmentId ? Number(d.shipmentId) : undefined,
        isActive: false, // variants default to inactive on server too
        sortOrder: idx, // keep UI order
      };
    });

    const payload = {
      name: productName.trim(),
      categoryId: Number(category),
      typeId: Number(type),
      materialId: Number(material),
      tagIds: selectedTags.map(Number),
      descriptionId: Number(selectedDescriptionId),
      sizeGuideId: Number(sizeGuideId),   // <-- add
      careGuideId: Number(careGuideId),   // <-- add
      variants: variantPayloads,
    };

    // multipart form with compressed images per variant (keyed by SKU)
    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));
    fd.append("adminEmail", admin?.email);
    // attach compressed images per variant (keyed by SKU)
    for (const v of variants) {
      const files = (variantImagesMap[String(v.id)] || []).map((x) => x.file);
      let i = 0;
      for (const file of files) {
        try {
          const compressed = await compressImage(file, {
            maxSizeMB: 1.2,
            maxWidthOrHeight: 1600,
            fileType: "image/webp",
          });
          const ext = (
            compressed.name?.split(".").pop() || "webp"
          ).toLowerCase();
          fd.append(
            `variantImages[${v.sku}]`,
            compressed,
            `${v.sku}-${i}.${ext}`
          );
        } catch (e) {
          console.warn("Image compression failed; sending original", e);
          const fallExt = (file.name?.split(".").pop() || "jpg").toLowerCase();
          fd.append(
            `variantImages[${v.sku}]`,
            file,
            `${v.sku}-${i}.${fallExt}`
          );
        }
        i++;
      }
    }

    try {
      await api.post("/admin/manage-products/insert", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Product created");

      // reset all relevant fields
      setProductName("");
      setCategory("");
      setType("");
      setMaterial("");
      setSelectedTags([]);
      setSelectedDescriptionId("");
      setSizeGuideId("");     // <-- add
      setCareGuideId("");     // <-- add
      setSelectedOptionValues({});
      setSelectedOptionOrder([]);
      setVariantDetails({});
      setVariantImagesMap({});

      setIsInserting(false); // ✅ re-enable only on success
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create product");

      setIsInserting(false); // also re-enable on failure
    }
  };

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
      <main className="flex flex-col gap-[2rem] min-h-screen ">
        {/* Product Info Card Skeleton */}
        <div className="bg-[#f8faf7] rounded-2xl p-10 shadow-md flex flex-col gap-8 w-full max-w-full">
          <Skeleton className="h-7 w-52 mb-2 bg-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-2">
            {/* Product Name */}
            <div>
              <Skeleton className="h-5 w-32 mb-3 bg-gray-100" />
              <Skeleton className="h-11 w-full rounded-md bg-gray-100" />
            </div>
            {/* Product Categories */}
            <div>
              <Skeleton className="h-5 w-32 mb-3 bg-gray-100" />
              <Skeleton className="h-11 w-full rounded-md bg-gray-100" />
            </div>
            {/* Product Type + Edit */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-5 w-32 bg-gray-100" />
                <Skeleton className="h-9 w-16 rounded bg-gray-100" />
              </div>
              <Skeleton className="h-11 w-full rounded-md bg-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-2">
            {/* Product Material + Edit */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-5 w-32 bg-gray-100" />
                <Skeleton className="h-9 w-16 rounded bg-gray-100" />
              </div>
              <Skeleton className="h-11 w-full rounded-md bg-gray-100" />
            </div>
            {/* Product Tags + Edit */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-5 w-32 bg-gray-100" />
                <Skeleton className="h-9 w-16 rounded bg-gray-100" />
              </div>
              <Skeleton className="h-11 w-full rounded-md bg-gray-100" />
            </div>
            {/* Description + Edit */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-5 w-32 bg-gray-100" />
                <Skeleton className="h-9 w-16 rounded bg-gray-100" />
              </div>
              <Skeleton className="h-11 w-full rounded-md bg-gray-100" />
            </div>
          </div>
          {/* Care Guide + Size Guide row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
            {/* Care Guide + Edit */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 bg-gray-100" />
              <Skeleton className="h-9 w-16 rounded bg-gray-100" />
              <Skeleton className="h-11 w-full rounded-md bg-gray-100" />
            </div>
            {/* Size Guide + Edit */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 bg-gray-100" />
              <Skeleton className="h-9 w-16 rounded bg-gray-100" />
              <Skeleton className="h-11 w-full rounded-md bg-gray-100" />
            </div>
          </div>
        </div>
        {/* Warning Info skeleton */}
        <div className="rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-900 px-6 py-4 w-full max-w-full text-lg flex items-center">
          <Skeleton className="h-6 w-96 bg-yellow-200" />
        </div>
        {/* Insert Product button skeleton */}
        <Skeleton className="h-12 w-full rounded-lg bg-gray-100" />
      </main>
    );
  }





  return (
    <main className="flex flex-col gap-[2rem]">
      <section className="w-full bg-[#fbfefb] h-[auto] shadow-lg rounded-lg p-[1rem]">
        <h2
          className="font-bold w-[10rem]
        mb-[1rem]"
        >
          Product Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-[0.5rem]">
          {/* Input for Product Name */}
          <div className="w-full flex flex-col gap-2 justify-end">
            <Label
              htmlFor="productName"
              className="font-semibold cursor-pointer pb-3"
            >
              Product Name
            </Label>
            <Input
              type="text"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="p-2 border border-gray-300 rounded-md "
            />
          </div>
          {/* Category (shadcn Select) */}
          <div className="w-full flex flex-col gap-2 justify-between">

            {/* Use aria-labelledby to associate Label with SelectTrigger */}
            <Label
              id="productCategoryLabel"
              className="font-semibold cursor-pointer pb-3 mt-2"
            >
              Product Categories
            </Label>
            <Select
              value={category}
              onValueChange={setCategory}
              name="productCategory"
            >
              <SelectTrigger
                aria-labelledby="productCategoryLabel"
                className="w-full"
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

          {/* Input for Product Type */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
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
                <DialogContent className="flex flex-col h-auto ">
                  <DialogHeader>
                    <DialogTitle>Type Name</DialogTitle>
                    <DialogDescription>
                      Make changes to your type here. Click save when
                      you&apos;re done.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="h-[20rem] flex flex-col gap-5  ">

                    <Label htmlFor="newType">New Type</Label>
                    <div className="flex gap-2">
                      <Input
                        id="newType"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addType()}
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
                    {/* List */}
                    <div className="overflow-y-auto  border rounded-md">
                      <ul>
                        {types.map((item, i) => (
                          <li
                            key={item.id}
                            className={`flex items-center gap-3 px-3 py-2 ${i !== 0 ? "border-t" : ""
                              }`}
                          >
                            <span className="flex-1">{item.name}</span>
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
                className="w-full"
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
          {/* Input for Product Material */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
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
                <DialogContent className="flex flex-col h-auto ">
                  <DialogHeader>
                    <DialogTitle>Material Name</DialogTitle>
                    <DialogDescription>
                      Make changes to your material here. Click save when
                      you&apos;re done.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="h-[20rem] flex flex-col gap-5  ">
                    <Label htmlFor="newMaterial">New Material</Label>
                    <div className="flex gap-2">
                      <Input
                        id="newMaterial"
                        value={newMaterial}
                        onChange={(e) => setNewMaterial(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addMaterial()}
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
                    {/* List */}
                    <div className="overflow-y-auto  border rounded-md">
                      <ul>
                        {materials.map((item, i) => (
                          <li
                            key={item.id}
                            className={`flex items-center gap-3 px-3 py-2 ${i !== 0 ? "border-t" : ""
                              }`}
                          >
                            <span className="flex-1">{item.name}</span>
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
                className="w-full"
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

          {/* Input For Product Tags */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
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

                {/* EDIT TAGS DIALOG CONTENT */}
                <DialogContent className="flex flex-col h-auto">
                  <DialogHeader>
                    <DialogTitle>Tags</DialogTitle>
                    <DialogDescription>
                      Add or remove tags. Newly added tags will be
                      auto-selected.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="h-[20rem] flex flex-col gap-4">

                    <Label htmlFor="newTag">Add New Tag</Label>
                    <div className="flex gap-2">
                      <Input
                        id="newTag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag()}
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
                            <span className="flex-1">{item.name}</span>
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

            {/* MULTI-SELECT (Popover + Checkbox list) */}
            <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="tags-trigger"
                  variant="outline"
                  role="combobox"
                  aria-labelledby="productTagsLabel"
                  aria-expanded={tagsOpen}
                  className="w-full justify-between"
                >
                  <span
                    className={
                      selectedTags.length === 0 ? "text-muted-foreground" : ""
                    }
                  >
                    {(() => {
                      const selected = tags
                        .filter((t) => selectedTags.includes(String(t.id)))
                        .map((t) => t.name);
                      if (selected.length === 0) return "Select tags";
                      if (selected.length <= 2) return selected.join(", ");
                      return `${selected.slice(0, 2).join(", ")} …`;
                    })()}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-full p-2">
                <div className="max-h-60 overflow-auto">
                  {tags.length === 0 && (
                    <div className="text-sm text-muted-foreground px-2 py-1.5">
                      No tags found.
                    </div>
                  )}

                  {tags.map((t) => {
                    const checked = selectedTags.includes(String(t.id));
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTag(t.id)} // click anywhere on row
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent"
                      >
                        <Checkbox
                          checked={checked}
                          onClick={(e) => e.stopPropagation()} // prevent double toggle
                          onCheckedChange={() => toggleTag(t.id)} // click directly on checkbox
                          aria-label={t.name}
                        />
                        <span className="flex-1 text-left">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Hidden inputs for form submits */}
            <div aria-hidden className="hidden">
              {selectedTags.map((id, i) => (
                <input
                  key={id}
                  type="hidden"
                  name={`tagIds[${i}]`}
                  value={id}
                />
              ))}
            </div>
          </div>
          {/* Input for Description */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
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

                {/* Manage saved description templates */}
                <DialogContent className="flex flex-col h-auto">
                  <DialogHeader>
                    <DialogTitle>Descriptions</DialogTitle>
                    <DialogDescription>
                      Create reusable descriptions and link them by title.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex flex-col gap-3">
                    <Label htmlFor="descriptionTitle">Description Title</Label>
                    <Input
                      id="descriptionTitle"
                      value={descriptionTitle}
                      onChange={(e) => setDescriptionTitle(e.target.value)}
                      placeholder="Description Title (e.g. 'Elevate Your Style')"
                    />
                    <Label htmlFor="descriptionBody">Description Body</Label>
                    <Textarea
                      id="descriptionBody"
                      value={descriptionBody}
                      onChange={(e) => setDescriptionBody(e.target.value)}
                      placeholder="Type description..."
                      className="h-32 resize-none overflow-y-auto" // fixed height + scroll
                      style={{ minHeight: "8rem", maxHeight: "8rem" }}
                      maxLength={400}
                    />

                    {/* Buttons: Add vs Update/Cancel */}
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
                    <DialogTitle>Saved Descriptions</DialogTitle>
                    <div className="overflow-y-auto border rounded-md max-h-60">
                      <ul>
                        {descriptions.map((item, i) => (
                          <li
                            key={item.id}
                            className={`px-3 py-2 ${i !== 0 ? "border-t" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="flex-1 text-left hover:underline"
                                onClick={() => startEditingDescription(item)} // <-- enter edit mode
                                title="Edit this description"
                              >
                                <div className="font-medium">{item.title}</div>
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

            {/* Dropdown: select a saved title -> updates selectedDescriptionId */}
            <Select
              value={selectedDescriptionId}
              onValueChange={(id) => {
                setSelectedDescriptionId(id);
                const found = descriptions.find(
                  (d) => String(d.id) === String(id)
                );
                if (found) startEditingDescription(found); // optional: go straight into edit mode
              }}
              name="productDescriptionSelect"
            >
              <SelectTrigger
                aria-labelledby="productDescriptionLabel"
                className="w-full truncate"
              >
                <SelectValue placeholder="Select a saved description" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {descriptions.map((d) => {
                  const label =
                    `${d.title} – ${d.body}`.length > 40
                      ? `${d.title} – ${d.body}`.slice(0, 39) + "…"
                      : `${d.title} – ${d.body}`;
                  return (
                    <SelectItem key={d.id} value={String(d.id)}>
                      <span className="block truncate">{label}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Care Guide */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
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
                    <Label htmlFor="careBody">Care Guide Body</Label>
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
              <SelectTrigger aria-labelledby="productCareGuideLabel" className="w-[auto] truncate">
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
                      <span className="block truncate">{label}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {/* Size Guide (CRUD + select) */}
          <div className="w-full flex flex-col gap-2">
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

                  <Label htmlFor="sizeGuideTitle">Size Guide Title</Label>
                  <div className="flex flex-col gap-3">
                    <Input
                      id="sizeGuideTitle"
                      value={sgTitle}
                      onChange={(e) => setSgTitle(e.target.value)}
                      placeholder="Size Guide Title (e.g. 'Tops Size Chart')"
                    />
                    <Label htmlFor="sizeGuideImage">Size Guide Image</Label>
                    <Input
                      type="file"
                      id="sizeGuideImage"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) {
                          setSgNewImage(null);
                          setSgPreview("");
                          return;
                        }
                        // Extra safety: check MIME type is an image
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
              <SelectContent className="w-[auto]">
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
        </div>
      </section>

      {!canConfigureVariants && (
        <div className="w-full bg-green-50 border border-gray-200 text-green-600 rounded-md px-3 py-2 text-center">
          Please enter the <strong>Product name and select a category</strong> to configure options and variants.
        </div>
      )}

      <section
        className={`w-full bg-[#fbfefb] h-[auto] shadow-lg rounded-lg p-[1rem] ${!canConfigureVariants ? "hidden pointer-events-none" : ""
          }`}
      >
        <h2
          className="font-bold w-[10rem]
        m-[1rem]"
        >
          Product Details
        </h2>
        <div className="flex justify-center flex-wrap gap-4 p-[0.5rem]">
          {/* Input for Options */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label
                id="productOptionLabel"
                className="font-semibold cursor-pointer"
              >
                Product Options
              </Label>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Edit</Button>
                </DialogTrigger>

                {/* EDIT OPTIONS DIALOG */}
                <DialogContent className="flex flex-col h-auto">
                  <DialogHeader>
                    <DialogTitle>Options</DialogTitle>
                    <DialogDescription>
                      Add or edit options and their values. Click an option
                      below to edit it.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Form: option name + values editor */}
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="optionName">Option Name</Label>
                    <Input
                      id="optionName"
                      value={optionName}
                      onChange={(e) => setOptionName(e.target.value)}
                      placeholder="Option name (e.g., Color, Size)"
                    />

                    <Label htmlFor="draftValue">Option Values</Label>
                    <div className="flex items-center gap-2">

                      <Input
                        id="draftValue"
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addDraftValue()}
                        placeholder="Add a value (e.g., Red)"
                      />
                      <Button
                        type="button"
                        onClick={addDraftValue}
                        disabled={valueAddLoading}
                      >
                        {valueAddLoading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                              <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                              <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                            </svg>
                            Adding...
                          </span>
                        ) : "Add value"}
                      </Button>
                    </div>

                    {/* chips/list of draft values */}
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto border rounded-md p-2">
                      {draftValues.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm"
                        >
                          {v}
                          <button
                            type="button"
                            className="text-red-500"
                            onClick={() => removeDraftValue(v)}
                            title="Remove"
                            disabled={removingDraftValue === v}
                          >
                            {removingDraftValue === v ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none">
                                <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                              </svg>
                            ) : "×"}
                          </button>
                        </span>
                      ))}
                      {draftValues.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          No values added yet.
                        </span>
                      )}
                    </div>

                    {/* Actions: Add vs Update/Cancel */}
                    {!editingOptionId ? (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={addOption}
                          disabled={optionAddLoading}
                        >
                          {optionAddLoading ? (
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
                          onClick={resetDialog}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={updateOption}
                          disabled={optionUpdateLoading}
                        >
                          {optionUpdateLoading ? (
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

                  {/* List of options to pick for editing */}
                  <div className="flex flex-col gap-2">
                    <DialogTitle>Existing Options</DialogTitle>
                    <div className="overflow-y-auto border rounded-md max-h-60">
                      <ul>
                        {options.map((item, i) => (
                          <li
                            key={item.id}
                            className={`px-3 py-2 ${i !== 0 ? "border-t" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="flex-1 text-left hover:underline"
                                onClick={() => startEditingOption(item)}
                                title="Edit this option"
                              >
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {item.values?.map((v) => v.name).join(", ") ||
                                    "—"}
                                </div>
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteOption(item.id)}
                                title="Delete option"
                                disabled={optionDeletingId === item.id}
                              >
                                {optionDeletingId === item.id ? (
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
                        {options.length === 0 && (
                          <li className="px-3 py-2 text-sm text-muted-foreground">
                            No options yet.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <DialogFooter className="flex justify-between mt-[1rem]">
                    <DialogClose asChild>
                      <Button variant="outline" onClick={resetDialog}>
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* VISIBLE OPTIONS PANEL (bounded by max width & height) */}
            <div className="border border-gray-500 rounded-md p-2 overflow-y-auto overflow-x-hidden space-y-2 h-[23.6rem] w-full">
              {options.length === 0 && (
                <div className="text-sm text-muted-foreground px-2 py-1.5">
                  No options found.
                </div>
              )}

              {options.map((opt) => (
                <div key={opt.id} className="border rounded-md">
                  {/* Option header */}
                  <div className="px-2 py-1 text-sm font-medium bg-muted truncate">
                    {opt.name}
                  </div>

                  {/* Values list */}
                  <div className="py-1">
                    {opt.values?.length ? (
                      opt.values.map((v) => {
                        const checked = (
                          selectedOptionValues[String(opt.id)] || []
                        ).includes(String(v.id));
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => toggleOptionValue(opt.id, v.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-accent"
                            title={`${opt.name}: ${v.name}`}
                          >
                            <Checkbox
                              checked={checked}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() =>
                                toggleOptionValue(opt.id, v.id)
                              }
                              aria-label={`${opt.name}: ${v.name}`}
                            />
                            <span className="flex-1 text-left truncate">
                              {v.name}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No values
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Hidden inputs (only if you submit via plain form) */}
            <div aria-hidden className="hidden">
              {Object.entries(selectedOptionValues).map(([optId, valueIds]) =>
                valueIds.map((vid) => (
                  <input
                    key={`${optId}-${vid}`}
                    type="hidden"
                    name={`optionSelections[${optId}][]`}
                    value={vid}
                  />
                ))
              )}
            </div>
          </div>
          {/* // Product Variant base on options selected */}
          <div className="w-[40rem] flex flex-col gap-2">
            <Label className="font-semibold cursor-pointer">
              Product Variant
            </Label>
            <div className="border border-gray-500 rounded-md h-[25rem] overflow-y-auto">
              <ul className="p-[1rem] flex flex-col gap-2 ">
                {variants.map((variant) => (
                  <li
                    key={variant.id}
                    className="flex justify-around w-full border-b border-gray-300 p-2 gap-2"
                  >
                    {(() => {
                      const imgs = getVariantImages(variant.id);
                      const main = imgs[0];
                      const details = getVariantDetails(variant.id);
                      return (
                        <>
                          <img
                            src={main?.url || DEFAULT_VARIANT_IMG}
                            className="w-[5rem] h-[5rem] border border-black object-cover bg-white"
                            alt="Variant"
                          />
                          <div className="flex flex-col justify-center">
                            <span>SKU: {variant.sku}</span>
                            <span>
                              {details.price ? `₱${details.price}` : "—"} •{" "}
                              {details.stock || 0} Stock
                            </span>
                          </div>
                        </>
                      );
                    })()}

                    <div className="flex justify-center items-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">Edit</Button>
                        </DialogTrigger>

                        <DialogContent className="flex flex-col ">
                          <DialogHeader>
                            <DialogTitle>
                              Product Variant:{" "}
                              <span>{(variant.labels ?? []).join(" / ")}</span>
                            </DialogTitle>
                            <DialogDescription>
                              SKU: <span>{variant.sku}</span>
                            </DialogDescription>
                          </DialogHeader>

                          <main className="flex  flex-col gap-3 overflow-y-scroll h-[20rem]">
                            <section className="flex flex-col w-full border h-[15rem] justify-center p-2 gap-2">
                              {(() => {
                                const imgs = getVariantImages(variant.id);
                                const main = imgs[0];

                                return (
                                  <>
                                    <div className="flex w-full h-[10rem] gap-2">
                                      {/* Main image */}
                                      <div className="relative">
                                        <img
                                          src={main?.url || DEFAULT_VARIANT_IMG}
                                          alt="Variant main"
                                          className="border rounded-lg h-[9rem] w-[10rem] object-cover bg-white"
                                        />
                                        {!main && (
                                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                                            No image
                                          </div>
                                        )}
                                      </div>

                                      {/* Thumbnails */}
                                      <div className="flex h-full w-[15rem] flex-wrap gap-2">
                                        {imgs.slice(1).map((img, i) => {
                                          const actualIndex = i + 1;
                                          return (
                                            <div
                                              key={img.url}
                                              className="relative"
                                            >
                                              <img
                                                src={img.url}
                                                alt="Variant thumb"
                                                className="border rounded-lg h-[4rem] w-[5rem] object-cover cursor-pointer"
                                                title="Make main"
                                                onClick={() =>
                                                  makeMainVariantImage(
                                                    variant.id,
                                                    actualIndex
                                                  )
                                                }
                                              />
                                              <button
                                                type="button"
                                                className="absolute -top-1 -right-1 bg-white border rounded-full h-5 w-5 text-xs"
                                                title="Remove"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  removeVariantImage(variant.id, actualIndex);
                                                }}
                                                disabled={variantImageRemoving[variant.id] === actualIndex}
                                              >
                                                {variantImageRemoving[variant.id] === actualIndex ? (
                                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none">
                                                    <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                    <path className="opacity-75" fill="currentColor" d="M8 1a7 7 0 0 1 7 7h-2a5 5 0 1 0-5-5V1z" />
                                                  </svg>
                                                ) : "×"}
                                              </button>
                                            </div>
                                          );
                                        })}
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
                                          // Filter: accept only image files
                                          const imageFiles = files.filter(f => f.type.startsWith("image/"));
                                          if (imageFiles.length !== files.length) {
                                            toast.error("Only image files are allowed. Some files were ignored.");
                                          }
                                          handleVariantFiles(variant.id, imageFiles);
                                          e.target.value = ""; // allow re-picking same files
                                        }}
                                      />
                                      <div className="text-xs text-muted-foreground">
                                        {getVariantImages(variant.id).length}/5
                                        images
                                      </div>
                                    </div>

                                    {/* Quick controls for existing main thumbnail */}
                                    {imgs.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="text-xs underline"
                                          onClick={() =>
                                            removeVariantImage(variant.id, 0)
                                          }
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
                              {(() => {
                                const details = getVariantDetails(variant.id);
                                const margin = computeMarginPct(
                                  details.price,
                                  details.costPerItem
                                );
                                const profitPerItem = computeProfitPerItem(
                                  details.price,
                                  details.costPerItem
                                );
                                return (
                                  <>
                                    <div className="flex justify-center flex-wrap gap-3 p-2">
                                      <div className="w-[8rem] p-1 flex flex-col gap-2">
                                        <Label
                                          htmlFor={`price-${variant.id}`}
                                          className="font-semibold"
                                        >
                                          Price
                                        </Label>
                                        <Input
                                          id={`price-${variant.id}`}
                                          type="text"
                                          value={details.price}
                                          placeholder="Price"
                                          onChange={(e) =>
                                            setVariantDetail(
                                              variant.id,
                                              "price",
                                              e.target.value.replace(
                                                /[^\d.]/g,
                                                ""
                                              )
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="w-[8rem] p-1 flex flex-col gap-2">
                                        <Label
                                          htmlFor={`compare-${variant.id}`}
                                          className="font-semibold"
                                        >
                                          Compare at Price
                                        </Label>
                                        <Input
                                          id={`compare-${variant.id}`}
                                          type="text"
                                          value={details.compareAt}
                                          placeholder="Compare "
                                          onChange={(e) =>
                                            setVariantDetail(
                                              variant.id,
                                              "compareAt",
                                              e.target.value.replace(
                                                /[^0-9.]/g,
                                                ""
                                              )
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="w-[8rem] p-1 flex flex-col gap-2">
                                        <Label
                                          htmlFor={`cost-${variant.id}`}
                                          className="font-semibold"
                                        >
                                          Cost per Item
                                        </Label>
                                        <Input
                                          id={`cost-${variant.id}`}
                                          type="text"
                                          value={details.costPerItem}
                                          placeholder="Cost per Item"
                                          onChange={(e) =>
                                            setVariantDetail(
                                              variant.id,
                                              "costPerItem",
                                              e.target.value.replace(
                                                /[^\d.]/g,
                                                ""
                                              )
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-center flex-wrap gap-2">
                                      <div className="w-[12rem] bg-[#EAF8EE] rounded-lg p-3">
                                        <Label>Margin</Label>
                                        <h2>{margin}%</h2>
                                      </div>
                                      <div className="w-[12rem] bg-[#EAF8EE] rounded-lg p-3">
                                        <Label>Profit</Label>
                                        <h2>₱{profitPerItem}</h2>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </section>

                            <section className="border w-full h-[auto] p-2 flex flex-col gap-3">
                              <h2>Inventory Details</h2>
                              {(() => {
                                const details = getVariantDetails(variant.id);
                                return (
                                  <div className="flex justify-center gap-3 p-2">
                                    <div className="w-[12rem] flex flex-col gap-2">
                                      <Label
                                        htmlFor={`stock-${variant.id}`}
                                        className="font-semibold"
                                      >
                                        Stock
                                      </Label>
                                      <Input
                                        id={`stock-${variant.id}`}
                                        type="text"
                                        value={details.stock}
                                        placeholder="Stock"
                                        onChange={(e) =>
                                          setVariantDetail(
                                            variant.id,
                                            "stock",
                                            e.target.value.replace(/[^\d]/g, "")
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="w-[12rem] flex flex-col justify-between">
                                      <Label>Stock Keeping Unit (SKU)</Label>
                                      <h2>{variant.sku.toUpperCase()}</h2>
                                    </div>
                                  </div>
                                );
                              })()}
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

                                  <DialogContent className="flex flex-col h-[30rem] overflow-y-scroll">
                                    <DialogHeader>
                                      <DialogTitle>Suppliers</DialogTitle>
                                      <DialogDescription>
                                        Add or edit suppliers. Click a supplier
                                        to edit its details.
                                      </DialogDescription>
                                    </DialogHeader>

                                    {/* Form */}
                                    <div className="flex flex-col gap-3">

                                      <Label htmlFor="supplierName">Supplier Name</Label>
                                      <Input
                                        id="supplierName"
                                        value={supplierName}
                                        onChange={(e) =>
                                          setSupplierName(e.target.value)
                                        }
                                        placeholder="Supplier name (e.g., ACME Trading)"
                                      />

                                      <Label htmlFor="supplierContactPerson">Contact Person</Label>
                                      <Input
                                        id="supplierContactPerson"
                                        value={supplierContactPerson}
                                        onChange={(e) =>
                                          setSupplierContactPerson(
                                            e.target.value
                                          )
                                        }
                                        placeholder="Contact person (e.g., Jane Doe)"
                                      />

                                      <Label htmlFor="supplierAddress">Address</Label>
                                      <Input
                                        id="supplierAddress"
                                        value={supplierAddress}
                                        onChange={(e) =>
                                          setSupplierAddress(e.target.value)
                                        }
                                        placeholder="Address"
                                      />

                                      <Label htmlFor="supplierPhone">Contact Number</Label>
                                      <Input
                                        type="number"
                                        value={supplierPhone}
                                        onChange={(e) => setSupplierPhone(e.target.value)}
                                        placeholder="Contact number"
                                        inputMode="numeric"
                                      />

                                      <Label htmlFor="supplierEmail">Email Address</Label>
                                      <Input
                                        id="supplierEmail"
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

                              {/* Dropdown to pick the supplier for this product */}
                              {(() => {
                                const vDetails = getVariantDetails(variant.id);
                                return (
                                  <Select
                                    value={vDetails.supplierId}
                                    onValueChange={(id) =>
                                      setVariantDetail(
                                        variant.id,
                                        "supplierId",
                                        id
                                      )
                                    }
                                    name={`supplierId_${variant.id}`}
                                  >
                                    <SelectTrigger
                                      aria-labelledby="supplierLabel"
                                      className="w-full truncate"
                                    >
                                      <SelectValue placeholder="Select a supplier" />
                                    </SelectTrigger>
                                    <SelectContent className="w-full">
                                      {suppliers.map((s) => {
                                        const label = `${s.name}${s.contactPerson
                                          ? " – " + s.contactPerson
                                          : ""
                                          }`;
                                        return (
                                          <SelectItem
                                            key={s.id}
                                            value={String(s.id)}
                                          >
                                            <span className="block truncate">
                                              {label}
                                            </span>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                );
                              })()}
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

                                  <DialogContent className="flex flex-col h-[30rem] overflow-y-scroll">
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

                              {/* Dropdown to pick the preset for this product */}
                              {(() => {
                                const vDetails = getVariantDetails(variant.id);
                                return (
                                  <Select
                                    value={vDetails.shipmentId}
                                    onValueChange={(id) =>
                                      setVariantDetail(
                                        variant.id,
                                        "shipmentId",
                                        id
                                      )
                                    }
                                    name={`shipmentId_${variant.id}`}
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
                                          <SelectItem
                                            key={s.id}
                                            value={String(s.id)}
                                          >
                                            <span className="block truncate">
                                              {label}
                                            </span>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                );
                              })()}
                            </section>
                          </main>

                          <DialogFooter className="flex justify-between mt-[1rem]">
                            <DialogClose asChild>
                              <Button variant="outline">Close</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Button
        variant="outline"
        onClick={handleInsertProduct}
        disabled={isInserting}
      >
        {isInserting ? "Inserting..." : "Insert Product"}
      </Button>
    </main>
  );
};
