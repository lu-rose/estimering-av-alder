import { useState } from "react";
import "./App.css";
import { fetchAgeEstimation } from "./api/ageApi";
import { COUNTRIES } from "./constants/countries";

function App() {
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState("");

  const [age, setAge] = useState<number | null>(null);
  const [estimatedName, setEstimatedName] = useState<string>("");
  const [estimatedCountryId, setEstimatedCountryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = estimatedCountryId
    ? COUNTRIES.find((country) => country.code === estimatedCountryId)
    : null;
  const capitalizedName = estimatedName
    ? estimatedName.charAt(0).toUpperCase() + estimatedName.slice(1)
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Vennligst skriv inn et navn");
      setAge(null);
      return;
    }

    setLoading(true);
    setError(null);
    setAge(null);

    try {
      const data = await fetchAgeEstimation(name, countryId || undefined);
      setAge(data.age);
      setEstimatedName(name);
      setEstimatedCountryId(countryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Hvor gammel er du basert på navnet ditt?</h1>
      <form onSubmit={handleSubmit}>
        <div className="inputGroup">
          <label htmlFor="name">Navn*</label>
          <div className="inputWrapper">
            <input
              type="text"
              id="name"
              placeholder="Navn Navnesen"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setAge(null);
                setError(null);
              }}
              disabled={loading}
            />
            {error && <p className="error">Feil: {error}</p>}
          </div>
        </div>

        <div className="inputGroup">
          <label htmlFor="countryId">Land</label>
          <select
            name="countryId"
            id="countryId"
            value={countryId}
            onChange={(e) => {
              setCountryId(e.target.value);
              setAge(null);
              setError(null);
            }}
            disabled={loading}
          >
            {COUNTRIES.map((country: (typeof COUNTRIES)[0]) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Laster..." : "Søk"}
        </button>
      </form>

      {age !== null && (
        <div className="result">
          <h2>
            {capitalizedName} er {age} år gammel i {selectedCountry?.name}{" "}
            {selectedCountry?.flag}
          </h2>
        </div>
      )}
    </div>
  );
}

export default App;
