"use client";

import { useState, useEffect, useCallback } from "react";

const COUNTRIES = [
  { name: "India", code: "IN", dialCode: "+91", pincodeLabel: "Pincode", pincodeLength: 6 },
  { name: "United States", code: "US", dialCode: "+1", pincodeLabel: "ZIP Code", pincodeLength: 5 },
  { name: "United Kingdom", code: "GB", dialCode: "+44", pincodeLabel: "Postcode", pincodeLength: 0 },
  { name: "Canada", code: "CA", dialCode: "+1", pincodeLabel: "Postal Code", pincodeLength: 0 },
  { name: "Australia", code: "AU", dialCode: "+61", pincodeLabel: "Postcode", pincodeLength: 4 },
  { name: "Germany", code: "DE", dialCode: "+49", pincodeLabel: "PLZ", pincodeLength: 5 },
  { name: "France", code: "FR", dialCode: "+33", pincodeLabel: "Code Postal", pincodeLength: 5 },
  { name: "Japan", code: "JP", dialCode: "+81", pincodeLabel: "Postal Code", pincodeLength: 7 },
  { name: "China", code: "CN", dialCode: "+86", pincodeLabel: "Postal Code", pincodeLength: 6 },
  { name: "Brazil", code: "BR", dialCode: "+55", pincodeLabel: "CEP", pincodeLength: 8 },
  { name: "South Korea", code: "KR", dialCode: "+82", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Mexico", code: "MX", dialCode: "+52", pincodeLabel: "Código Postal", pincodeLength: 5 },
  { name: "Italy", code: "IT", dialCode: "+39", pincodeLabel: "CAP", pincodeLength: 5 },
  { name: "Spain", code: "ES", dialCode: "+34", pincodeLabel: "Código Postal", pincodeLength: 5 },
  { name: "Netherlands", code: "NL", dialCode: "+31", pincodeLabel: "Postcode", pincodeLength: 0 },
  { name: "Russia", code: "RU", dialCode: "+7", pincodeLabel: "Postal Code", pincodeLength: 6 },
  { name: "South Africa", code: "ZA", dialCode: "+27", pincodeLabel: "Postal Code", pincodeLength: 4 },
  { name: "Singapore", code: "SG", dialCode: "+65", pincodeLabel: "Postal Code", pincodeLength: 6 },
  { name: "New Zealand", code: "NZ", dialCode: "+64", pincodeLabel: "Postcode", pincodeLength: 4 },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", pincodeLabel: "Postal Code", pincodeLength: 0 },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Turkey", code: "TR", dialCode: "+90", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Thailand", code: "TH", dialCode: "+66", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Indonesia", code: "ID", dialCode: "+62", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Malaysia", code: "MY", dialCode: "+60", pincodeLabel: "Postcode", pincodeLength: 5 },
  { name: "Philippines", code: "PH", dialCode: "+63", pincodeLabel: "ZIP Code", pincodeLength: 4 },
  { name: "Vietnam", code: "VN", dialCode: "+84", pincodeLabel: "Postal Code", pincodeLength: 6 },
  { name: "Bangladesh", code: "BD", dialCode: "+880", pincodeLabel: "Postal Code", pincodeLength: 4 },
  { name: "Pakistan", code: "PK", dialCode: "+92", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Sri Lanka", code: "LK", dialCode: "+94", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Nepal", code: "NP", dialCode: "+977", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Nigeria", code: "NG", dialCode: "+234", pincodeLabel: "Postal Code", pincodeLength: 6 },
  { name: "Kenya", code: "KE", dialCode: "+254", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Egypt", code: "EG", dialCode: "+20", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Argentina", code: "AR", dialCode: "+54", pincodeLabel: "CPA", pincodeLength: 0 },
  { name: "Colombia", code: "CO", dialCode: "+57", pincodeLabel: "Código Postal", pincodeLength: 6 },
  { name: "Chile", code: "CL", dialCode: "+56", pincodeLabel: "Código Postal", pincodeLength: 7 },
  { name: "Peru", code: "PE", dialCode: "+51", pincodeLabel: "Código Postal", pincodeLength: 5 },
  { name: "Sweden", code: "SE", dialCode: "+46", pincodeLabel: "Postnummer", pincodeLength: 5 },
  { name: "Norway", code: "NO", dialCode: "+47", pincodeLabel: "Postnummer", pincodeLength: 4 },
  { name: "Denmark", code: "DK", dialCode: "+45", pincodeLabel: "Postnummer", pincodeLength: 4 },
  { name: "Finland", code: "FI", dialCode: "+358", pincodeLabel: "Postinumero", pincodeLength: 5 },
  { name: "Poland", code: "PL", dialCode: "+48", pincodeLabel: "Kod Pocztowy", pincodeLength: 0 },
  { name: "Belgium", code: "BE", dialCode: "+32", pincodeLabel: "Code Postal", pincodeLength: 4 },
  { name: "Switzerland", code: "CH", dialCode: "+41", pincodeLabel: "PLZ", pincodeLength: 4 },
  { name: "Austria", code: "AT", dialCode: "+43", pincodeLabel: "PLZ", pincodeLength: 4 },
  { name: "Portugal", code: "PT", dialCode: "+351", pincodeLabel: "Código Postal", pincodeLength: 0 },
  { name: "Greece", code: "GR", dialCode: "+30", pincodeLabel: "TK", pincodeLength: 5 },
  { name: "Ireland", code: "IE", dialCode: "+353", pincodeLabel: "Eircode", pincodeLength: 0 },
  { name: "Israel", code: "IL", dialCode: "+972", pincodeLabel: "Postal Code", pincodeLength: 7 },
  { name: "Qatar", code: "QA", dialCode: "+974", pincodeLabel: "Postal Code", pincodeLength: 0 },
  { name: "Kuwait", code: "KW", dialCode: "+965", pincodeLabel: "Postal Code", pincodeLength: 5 },
  { name: "Oman", code: "OM", dialCode: "+968", pincodeLabel: "Postal Code", pincodeLength: 3 },
  { name: "Bahrain", code: "BH", dialCode: "+973", pincodeLabel: "Postal Code", pincodeLength: 0 },
];

const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

export default function AddressForm({ initialData, onSave, onCancel, submitLabel = "Save Address" }) {
  const [country, setCountry] = useState(initialData?.country || "India");
  const [pincode, setPincode] = useState(initialData?.pincode || "");
  const [houseBuilding, setHouseBuilding] = useState(initialData?.houseBuilding || "");
  const [street, setStreet] = useState(initialData?.street || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [state, setState] = useState(initialData?.state || "");
  const [receiverName, setReceiverName] = useState(initialData?.receiverName || "");
  const [contactNumber, setContactNumber] = useState(initialData?.contactNumber || "");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [errors, setErrors] = useState({});

  const selectedCountry = SORTED_COUNTRIES.find((c) => c.name === country) || SORTED_COUNTRIES[0];

  const fetchPincodeData = useCallback(
    async (code) => {
      if (!code || code.length < 3) return;
      setPincodeLoading(true);
      setPincodeError("");

      try {
        if (selectedCountry.code === "IN") {
          // India: use api.postalpincode.in
          const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
          const data = await res.json();
          if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
            const po = data[0].PostOffice[0];
            setCity(po.District || po.Division || "");
            setState(po.State || "");
          } else {
            setPincodeError("Invalid pincode");
          }
        } else {
          // International: use zippopotam.us
          const res = await fetch(
            `https://api.zippopotam.us/${selectedCountry.code.toLowerCase()}/${code}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.places?.length) {
              setCity(data.places[0]["place name"] || "");
              setState(data.places[0]["state"] || "");
            }
          } else {
            setPincodeError(`Invalid ${selectedCountry.pincodeLabel.toLowerCase()}`);
          }
        }
      } catch {
        setPincodeError("Could not verify. Please enter city/state manually.");
      } finally {
        setPincodeLoading(false);
      }
    },
    [selectedCountry]
  );

  useEffect(() => {
    const targetLen = selectedCountry.pincodeLength;
    if (targetLen > 0 && pincode.length === targetLen) {
      fetchPincodeData(pincode);
    } else if (targetLen === 0 && pincode.length >= 3) {
      // For countries with variable-length pincodes, debounce
      const timer = setTimeout(() => fetchPincodeData(pincode), 800);
      return () => clearTimeout(timer);
    }
  }, [pincode, selectedCountry, fetchPincodeData]);

  const validate = () => {
    const errs = {};
    if (!country) errs.country = "Required";
    if (!pincode.trim()) errs.pincode = "Required";
    if (!houseBuilding.trim()) errs.houseBuilding = "Required";
    if (!street.trim()) errs.street = "Required";
    if (!city.trim()) errs.city = "Required";
    if (!state.trim()) errs.state = "Required";
    if (!receiverName.trim()) errs.receiverName = "Required";
    if (!contactNumber.trim()) errs.contactNumber = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      country,
      countryCode: selectedCountry.code,
      pincode,
      houseBuilding,
      street,
      city,
      state,
      receiverName,
      contactNumber: `${selectedCountry.dialCode} ${contactNumber}`,
      dialCode: selectedCountry.dialCode,
      rawContactNumber: contactNumber,
    });
  };

  return (
    <form className="address-form" onSubmit={handleSubmit}>
      {/* Country */}
      <div className="address-form__field address-form__field--full">
        <label className="address-form__label">Country / Region</label>
        <select
          className={"address-form__select" + (errors.country ? " address-form__select--error" : "")}
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPincode("");
            setCity("");
            setState("");
            setPincodeError("");
          }}
        >
          {SORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.country && <span className="address-form__error">{errors.country}</span>}
      </div>

      {/* Pincode */}
      <div className="address-form__field address-form__field--half">
        <label className="address-form__label">{selectedCountry.pincodeLabel} *</label>
        <div className="address-form__pincode-wrap">
          <input
            type="text"
            className={"address-form__input" + (errors.pincode ? " address-form__input--error" : "")}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ""))}
            placeholder={`Enter ${selectedCountry.pincodeLabel.toLowerCase()}`}
            maxLength={selectedCountry.pincodeLength > 0 ? selectedCountry.pincodeLength : 10}
          />
          {pincodeLoading && <span className="address-form__pincode-spinner" />}
        </div>
        {pincodeError && <span className="address-form__error">{pincodeError}</span>}
        {errors.pincode && <span className="address-form__error">{errors.pincode}</span>}
      </div>

      {/* House/Building */}
      <div className="address-form__field address-form__field--half">
        <label className="address-form__label">House No. / Building *</label>
        <input
          type="text"
          className={"address-form__input" + (errors.houseBuilding ? " address-form__input--error" : "")}
          value={houseBuilding}
          onChange={(e) => setHouseBuilding(e.target.value)}
          placeholder="Flat, House no., Building name"
        />
        {errors.houseBuilding && <span className="address-form__error">{errors.houseBuilding}</span>}
      </div>

      {/* Street */}
      <div className="address-form__field address-form__field--full">
        <label className="address-form__label">Street / Area *</label>
        <input
          type="text"
          className={"address-form__input" + (errors.street ? " address-form__input--error" : "")}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Street name, Area, Colony"
        />
        {errors.street && <span className="address-form__error">{errors.street}</span>}
      </div>

      {/* City */}
      <div className="address-form__field address-form__field--half">
        <label className="address-form__label">Town / City *</label>
        <input
          type="text"
          className={"address-form__input" + (errors.city ? " address-form__input--error" : "")}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
        />
        {errors.city && <span className="address-form__error">{errors.city}</span>}
      </div>

      {/* State */}
      <div className="address-form__field address-form__field--half">
        <label className="address-form__label">State / Province *</label>
        <input
          type="text"
          className={"address-form__input" + (errors.state ? " address-form__input--error" : "")}
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State"
        />
        {errors.state && <span className="address-form__error">{errors.state}</span>}
      </div>

      {/* Receiver Name */}
      <div className="address-form__field address-form__field--half">
        <label className="address-form__label">Receiver Name *</label>
        <input
          type="text"
          className={"address-form__input" + (errors.receiverName ? " address-form__input--error" : "")}
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          placeholder="Full name of receiver"
        />
        {errors.receiverName && <span className="address-form__error">{errors.receiverName}</span>}
      </div>

      {/* Contact Number */}
      <div className="address-form__field address-form__field--half">
        <label className="address-form__label">Contact Number *</label>
        <div className="address-form__phone-wrap">
          <span className="address-form__dial-code">{selectedCountry.dialCode}</span>
          <input
            type="tel"
            className={"address-form__input address-form__input--phone" + (errors.contactNumber ? " address-form__input--error" : "")}
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Mobile number"
          />
        </div>
        {errors.contactNumber && <span className="address-form__error">{errors.contactNumber}</span>}
      </div>

      {/* Actions */}
      <div className="address-form__actions">
        {onCancel && (
          <button type="button" className="address-form__btn address-form__btn--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="address-form__btn address-form__btn--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export { SORTED_COUNTRIES };
