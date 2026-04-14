import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar";
import MapPicker from "../components/MapPicker";
import { useAuth } from "../context/AuthContext";

const PERMIT_TYPES = [
  {
    value: "building_permit",
    label: "Building Permit",
    icon: "🏗️",
    desc: "New construction, renovation, addition, alteration",
  },
  {
    value: "electrical_permit",
    label: "Electrical Permit",
    icon: "⚡",
    desc: "Electrical installation, rewiring, additional loads",
  },
  {
    value: "cfei",
    label: "CFEI",
    icon: "🔥",
    desc: "Certificate of Final Electrical Inspection",
  },
  {
    value: "mechanical_permit",
    label: "Mechanical Permit",
    icon: "⚙️",
    desc: "HVAC, elevators, mechanical equipment",
  },
  {
    value: "sanitary_permit",
    label: "Sanitary Permit",
    icon: "🚿",
    desc: "Plumbing, drainage, sanitary installation",
  },
  {
    value: "fencing_permit",
    label: "Fencing Permit",
    icon: "🚧",
    desc: "Perimeter fence, gate construction",
  },
  {
    value: "demolition_permit",
    label: "Demolition Permit",
    icon: "🏚️",
    desc: "Partial or full demolition of structures",
  },
];

const BARANGAYS = [
  "Borol 1st",
  "Borol 2nd",
  "Dalig",
  "Longos",
  "Panginay",
  "Pulong Gubat",
  "Wawa",
  "San Juan",
  "Santol",
];

const SCOPE_OPTIONS = [
  "New Construction",
  "Addition",
  "Alteration",
  "Renovation",
  "Repair",
  "Demolition",
  "Moving / Relocation",
  "Change of Occupancy",
];

const OCCUPANCY_OPTIONS = [
  "Residential",
  "Commercial",
  "Industrial",
  "Institutional",
  "Educational",
  "Agricultural",
  "Mixed Use",
];

export default function ApplyPermit() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    permitType: searchParams.get("type") || "",
    // Applicant
    applicantName: user?.fullName || "",
    applicantAddress: user?.address || "",
    contactNumber: user?.contactNumber || "",
    email: user?.email || "",
    ownerName: "",
    ownerAddress: "",
    // Property
    propertyAddress: "",
    barangay: "",
    lotNumber: "",
    blockNumber: "",
    tctNumber: "",
    taxDeclarationNumber: "",
    latitude: null,
    longitude: null,
    // Construction
    scopeOfWork: "",
    useOrCharacterOfOccupancy: "",
    projectCost: "",
    floorArea: "",
    numberOfStoreys: "",
    totalFloorArea: "",
    buildingHeight: "",
    lotArea: "",
    // Electrical
    systemCapacity: "",
    installedCapacity: "",
    // Engineer
    architectEngineerName: "",
    architectEngineerLicenseNo: "",
    architectEngineerPrcNo: "",
    architectEngineerAddress: "",
    architectEngineerContact: "",
    electricalEngineerName: "",
    electricalEngineerLicenseNo: "",
    sanitaryEngineerName: "",
    mechanicalEngineerName: "",
    civilEngineerName: "",
  });

  useEffect(() => {
    setForm((f) => ({
      ...f,
      applicantName: user?.fullName || "",
      applicantAddress: user?.address || "",
      contactNumber: user?.contactNumber || "",
      email: user?.email || "",
    }));
  }, [user]);

  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (i) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const canProceed = () => {
    if (step === 1) return !!form.permitType;
    if (step === 2)
      return (
        form.applicantName &&
        form.applicantAddress &&
        form.contactNumber &&
        form.email
      );
    if (step === 3) return form.propertyAddress && form.barangay;
    return true;
  };

  const submit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("permitData", JSON.stringify(form));
      files.forEach((f) => fd.append("attachments", f));
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/permits`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success(
        `Application submitted! Transaction #: ${res.data.transactionNumber}`,
      );
      navigate(`/permits/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    "Permit Type",
    "Applicant Info",
    "Property Details",
    "Construction Details",
    "Documents",
    "Review",
  ];

  const selectedType = PERMIT_TYPES.find((t) => t.value === form.permitType);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="breadcrumb">
            Dashboard / <span>Apply for Permit</span>
          </div>
          <h1>📝 Apply for Permit</h1>
          <p>
            Municipality of Balagtas Engineering Office — Online Application
          </p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator" style={{ marginBottom: 28 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`step ${step > i + 1 ? "done" : step === i + 1 ? "active" : ""}`}
              >
                <div className="step-number">{step > i + 1 ? "✓" : i + 1}</div>
                <span style={{ fontSize: 11 }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`step-line ${step > i + 1 ? "done" : ""}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="card">
          {/* STEP 1: Permit Type Selection */}
          {step === 1 && (
            <div>
              <div className="form-section-title">Select Permit Type</div>
              <div
                className="permit-type-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {PERMIT_TYPES.map((type) => (
                  <div
                    key={type.value}
                    onClick={() =>
                      setForm((f) => ({ ...f, permitType: type.value }))
                    }
                    style={{
                      border: `2px solid ${form.permitType === type.value ? "#1e4e78" : "#e2e8f0"}`,
                      borderRadius: 10,
                      padding: "16px 14px",
                      cursor: "pointer",
                      background:
                        form.permitType === type.value
                          ? "rgba(30,78,120,0.04)"
                          : "#fff",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>
                      {type.icon}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        marginBottom: 4,
                        color:
                          form.permitType === type.value
                            ? "#1e4e78"
                            : "#1a2332",
                      }}
                    >
                      {type.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {type.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Applicant Info */}
          {step === 2 && (
            <div>
              <div className="form-section-title">
                Applicant / Owner Information
              </div>
              <div className="form-grid">
                <div className="form-group col-span-2">
                  <label className="form-label">
                    Full Name of Applicant <span>*</span>
                  </label>
                  <input
                    name="applicantName"
                    className="form-control"
                    value={form.applicantName}
                    onChange={set}
                    required
                  />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label">
                    Complete Address <span>*</span>
                  </label>
                  <input
                    name="applicantAddress"
                    className="form-control"
                    value={form.applicantAddress}
                    onChange={set}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Contact Number <span>*</span>
                  </label>
                  <input
                    name="contactNumber"
                    className="form-control"
                    value={form.contactNumber}
                    onChange={set}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Email Address <span>*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={set}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Property Owner Name{" "}
                    <span style={{ color: "#64748b", fontWeight: 400 }}>
                      (if different)
                    </span>
                  </label>
                  <input
                    name="ownerName"
                    className="form-control"
                    value={form.ownerName}
                    onChange={set}
                    placeholder="Leave blank if same as applicant"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Property Owner Address</label>
                  <input
                    name="ownerAddress"
                    className="form-control"
                    value={form.ownerAddress}
                    onChange={set}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Property Details */}
          {step === 3 && (
            <div>
              <div className="form-section-title">
                Property / Location Information
              </div>
              <div className="form-grid">
                <div className="form-group col-span-2">
                  <label className="form-label">
                    Property / Street Address <span>*</span>
                  </label>
                  <input
                    name="propertyAddress"
                    className="form-control"
                    value={form.propertyAddress}
                    onChange={set}
                    placeholder="House No., Street, Subdivision..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Barangay <span>*</span>
                  </label>
                  <select
                    name="barangay"
                    className="form-control"
                    value={form.barangay}
                    onChange={set}
                    required
                  >
                    <option value="">Select Barangay</option>
                    {BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Municipality</label>
                  <input
                    className="form-control"
                    value="Balagtas"
                    disabled
                    style={{ background: "#f0f4f8" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Province</label>
                  <input
                    className="form-control"
                    value="Bulacan"
                    disabled
                    style={{ background: "#f0f4f8" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input
                    className="form-control"
                    value="3016"
                    disabled
                    style={{ background: "#f0f4f8" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lot Number</label>
                  <input
                    name="lotNumber"
                    className="form-control"
                    value={form.lotNumber}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Block Number</label>
                  <input
                    name="blockNumber"
                    className="form-control"
                    value={form.blockNumber}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">TCT / OCT Number</label>
                  <input
                    name="tctNumber"
                    className="form-control"
                    value={form.tctNumber}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Declaration Number</label>
                  <input
                    name="taxDeclarationNumber"
                    className="form-control"
                    value={form.taxDeclarationNumber}
                    onChange={set}
                  />
                </div>
              </div>

              {/* Map */}
              <div className="form-section-title" style={{ marginTop: 20 }}>
                Pin Exact Property Location
              </div>
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                onChange={(lat, lng) =>
                  setForm((f) => ({ ...f, latitude: lat, longitude: lng }))
                }
              />
            </div>
          )}

          {/* STEP 4: Construction Details */}
          {step === 4 && (
            <div>
              <div className="form-section-title">
                Construction / Project Details
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Scope of Work</label>
                  <select
                    name="scopeOfWork"
                    className="form-control"
                    value={form.scopeOfWork}
                    onChange={set}
                  >
                    <option value="">Select...</option>
                    {SCOPE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Use / Character of Occupancy
                  </label>
                  <select
                    name="useOrCharacterOfOccupancy"
                    className="form-control"
                    value={form.useOrCharacterOfOccupancy}
                    onChange={set}
                  >
                    <option value="">Select...</option>
                    {OCCUPANCY_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Estimated Project Cost (PHP)
                  </label>
                  <input
                    name="projectCost"
                    type="number"
                    className="form-control"
                    value={form.projectCost}
                    onChange={set}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Storeys</label>
                  <input
                    name="numberOfStoreys"
                    type="number"
                    className="form-control"
                    value={form.numberOfStoreys}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Floor Area (sq.m)</label>
                  <input
                    name="floorArea"
                    type="number"
                    className="form-control"
                    value={form.floorArea}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lot Area (sq.m)</label>
                  <input
                    name="lotArea"
                    type="number"
                    className="form-control"
                    value={form.lotArea}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Building Height (m)</label>
                  <input
                    name="buildingHeight"
                    type="number"
                    className="form-control"
                    value={form.buildingHeight}
                    onChange={set}
                  />
                </div>
              </div>

              {/* Electrical fields */}
              {["electrical_permit", "cfei"].includes(form.permitType) && (
                <>
                  <div className="form-section-title" style={{ marginTop: 20 }}>
                    Electrical Details
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        System Capacity (kVA)
                      </label>
                      <input
                        name="systemCapacity"
                        className="form-control"
                        value={form.systemCapacity}
                        onChange={set}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Installed Capacity (kVA)
                      </label>
                      <input
                        name="installedCapacity"
                        className="form-control"
                        value={form.installedCapacity}
                        onChange={set}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Design Professional */}
              <div className="form-section-title" style={{ marginTop: 20 }}>
                Design Professional / Engineer-of-Record
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Architect / Civil Engineer Name
                  </label>
                  <input
                    name="architectEngineerName"
                    className="form-control"
                    value={form.architectEngineerName}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PRC License No.</label>
                  <input
                    name="architectEngineerLicenseNo"
                    className="form-control"
                    value={form.architectEngineerLicenseNo}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PTR No.</label>
                  <input
                    name="architectEngineerPrcNo"
                    className="form-control"
                    value={form.architectEngineerPrcNo}
                    onChange={set}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input
                    name="architectEngineerContact"
                    className="form-control"
                    value={form.architectEngineerContact}
                    onChange={set}
                  />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label">Address</label>
                  <input
                    name="architectEngineerAddress"
                    className="form-control"
                    value={form.architectEngineerAddress}
                    onChange={set}
                  />
                </div>
                {["electrical_permit", "cfei"].includes(form.permitType) && (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        Electrical Engineer Name
                      </label>
                      <input
                        name="electricalEngineerName"
                        className="form-control"
                        value={form.electricalEngineerName}
                        onChange={set}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">EE PRC License No.</label>
                      <input
                        name="electricalEngineerLicenseNo"
                        className="form-control"
                        value={form.electricalEngineerLicenseNo}
                        onChange={set}
                      />
                    </div>
                  </>
                )}
                {form.permitType === "sanitary_permit" && (
                  <div className="form-group">
                    <label className="form-label">Sanitary Engineer Name</label>
                    <input
                      name="sanitaryEngineerName"
                      className="form-control"
                      value={form.sanitaryEngineerName}
                      onChange={set}
                    />
                  </div>
                )}
                {form.permitType === "mechanical_permit" && (
                  <div className="form-group">
                    <label className="form-label">
                      Mechanical Engineer Name
                    </label>
                    <input
                      name="mechanicalEngineerName"
                      className="form-control"
                      value={form.mechanicalEngineerName}
                      onChange={set}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Documents */}
          {step === 5 && (
            <div>
              <div className="form-section-title">
                Upload Required Documents
              </div>

              {/* Requirements checklist */}
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                <div>
                  <strong>📋 Requirements for {selectedType?.label}:</strong>
                  <ul
                    style={{
                      marginTop: 8,
                      paddingLeft: 20,
                      fontSize: 12,
                      lineHeight: 2,
                    }}
                  >
                    {getRequirements(form.permitType).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                className={`file-upload-area ${dragOver ? "dragover" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Click to upload or drag & drop files
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  PDF, JPG, PNG, DWG — Max 10MB per file
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  accept=".pdf,.jpg,.jpeg,.png,.dwg,.doc,.docx"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <div className="file-list" style={{ marginTop: 16 }}>
                  {files.map((f, i) => (
                    <div key={i} className="file-item">
                      <div className="file-item-name">
                        <span>
                          {f.type?.includes("pdf")
                            ? "📄"
                            : f.type?.includes("image")
                              ? "🖼️"
                              : "📎"}
                        </span>
                        <span>{f.name}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span className="file-item-size">
                          {formatFileSize(f.size)}
                        </span>
                        <button
                          className="btn-remove-file"
                          onClick={() => removeFile(i)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Review */}
          {step === 6 && (
            <div>
              <div>
                <div className="form-section-title">
                  Review Your Application
                </div>
                <div className="alert alert-warning">
                  ⚠️ Please review all information carefully before submitting.
                  Incorrect information may cause delays.
                </div>

                <ReviewSection
                  title="Permit Type"
                  items={[
                    ["Type", selectedType?.label],
                    [
                      "Transaction Prefix",
                      selectedType?.value === "building_permit"
                        ? "BP-XXXXXX"
                        : selectedType?.value === "electrical_permit"
                          ? "EP-XXXXXX"
                          : "AUTO-GENERATED",
                    ],
                  ]}
                />
                <ReviewSection
                  title="Applicant Info"
                  items={[
                    ["Full Name", form.applicantName],
                    ["Address", form.applicantAddress],
                    ["Contact", form.contactNumber],
                    ["Email", form.email],
                  ]}
                />
                <ReviewSection
                  title="Property Details"
                  items={[
                    ["Address", form.propertyAddress],
                    ["Barangay", form.barangay],
                    ["Lot No.", form.lotNumber],
                    ["TCT No.", form.tctNumber],
                    [
                      "GPS",
                      form.latitude
                        ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
                        : "Not set",
                    ],
                  ]}
                />
                <ReviewSection
                  title="Construction Details"
                  items={[
                    ["Scope", form.scopeOfWork],
                    ["Occupancy", form.useOrCharacterOfOccupancy],
                    [
                      "Project Cost",
                      form.projectCost
                        ? `₱${Number(form.projectCost).toLocaleString()}`
                        : "-",
                    ],
                    [
                      "Floor Area",
                      form.floorArea ? `${form.floorArea} sq.m` : "-",
                    ],
                    ["Storeys", form.numberOfStoreys],
                  ]}
                />
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  background: "#f0f4f8",
                  borderRadius: 10,
                }}
              >
                <strong style={{ fontSize: 13 }}>
                  📎 Attached Files ({files.length}):
                </strong>
                {files.length === 0 ? (
                  <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                    No files attached
                  </div>
                ) : (
                  <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 12 }}>
                    {files.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="alert alert-success" style={{ marginTop: 16 }}>
                //✅ By submitting, you certify that all information provided is
                true and correct. False declarations are punishable by law.
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              className="btn btn-outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
            >
              ← Previous
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <span
                style={{ color: "#64748b", fontSize: 12, alignSelf: "center" }}
              >
                Step {step} of {steps.length}
              </span>
              {step < steps.length ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (canProceed()) setStep((s) => s + 1);
                    else toast.warning("Please fill in required fields");
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="btn btn-accent"
                  onClick={submit}
                  disabled={loading}
                >
                  {loading ? "⏳ Submitting..." : "🚀 Submit Application"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewSection({ title, items }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16 }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 12,
          color: "#1e4e78",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </div>
      {items.map(([k, v]) =>
        v ? (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            <span style={{ color: "#64748b" }}>{k}</span>
            <span
              style={{ fontWeight: 600, maxWidth: 200, textAlign: "right" }}
            >
              {v}
            </span>
          </div>
        ) : null,
      )}
    </div>
  );
}

function getRequirements(type) {
  const common = [
    "Duly accomplished application form",
    "Certified true copy of TCT/OCT",
    "Tax Declaration",
    "Real Property Tax Clearance",
    "Lot Plan / Survey Plan with vicinity map",
  ];
  const map = {
    building_permit: [
      ...common,
      "Architectural Plans (5 sets)",
      "Structural Plans & Design Analysis (5 sets)",
      "Electrical Plans (5 sets)",
      "Sanitary/Plumbing Plans (5 sets)",
      "Bill of Materials & Cost Estimate",
      "Specifications",
      "Barangay Clearance",
    ],
    electrical_permit: [
      ...common,
      "Electrical Plans (5 sets)",
      "Single Line Diagram",
      "Bill of Materials (Electrical)",
      "PRC ID & PTR of Electrical Engineer",
    ],
    cfei: [
      "Letter of Request for CFEI",
      "As-Built Electrical Plans",
      "PRC ID & PTR of Electrical Engineer",
      "Building Permit (if applicable)",
      "Previous Electrical Permit",
    ],
    mechanical_permit: [
      ...common,
      "Mechanical Plans (5 sets)",
      "Equipment Specifications",
      "PRC ID & PTR of Mechanical Engineer",
    ],
    sanitary_permit: [
      ...common,
      "Sanitary/Plumbing Plans (5 sets)",
      "PRC ID & PTR of Sanitary Engineer",
    ],
    fencing_permit: [
      ...common,
      "Fencing Plan (5 sets)",
      "Material Specifications",
    ],
    demolition_permit: [
      ...common,
      "Demolition Plan",
      "Clearance from neighboring properties",
      "Structural Assessment Report",
    ],
  };
  return map[type] || common;
}
