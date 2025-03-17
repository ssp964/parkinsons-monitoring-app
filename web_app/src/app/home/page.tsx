"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { patientApi } from '@/services/api';
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Patient {
    patient_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export default function Home() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [date, setDate] = useState("");
    interface TestResult {
        test_id: string;
        patient_id: number;
        subtest_name: string;
        aggregated_score: number;
        date: string;
    }

    const [filteredResults, setFilteredResults] = useState<TestResult[]>([]);
    const [mocaScores, setMocaScores] = useState<{ date: string; score: number }[]>([]);
    const [selectedMocaScore, setSelectedMocaScore] = useState<number | null>(null);

    // Sample test results linked with patient_id
    const testResults = [
        { test_id: "T1001", patient_id: 1, subtest_name: "Memory", aggregated_score: 5.6, date: "2025-03-10" },
        { test_id: "T1001", patient_id: 1, subtest_name: "Cognition", aggregated_score: 6.2, date: "2025-03-12" },
        { test_id: "T1001", patient_id: 1, subtest_name: "Attention", aggregated_score: 7.4, date: "2025-03-14" },
        { test_id: "T1001", patient_id: 1, subtest_name: "Visual-Spatial", aggregated_score: 6.8, date: "2025-03-15" }
    ];

    // Sample patients (linked to test results via patient_id)
    const patients = [{ patient_id: 1, firstName: "John", lastName: "Doe" }];

    // Filter logic
    const handleFilter = () => {
        if (!firstName || !lastName || !date) return;

        const selectedPatient = patients.find(
            (p) => p.firstName.toLowerCase() === firstName.toLowerCase() && p.lastName.toLowerCase() === lastName.toLowerCase()
        );

        if (!selectedPatient) {
            setFilteredResults([]);
            setMocaScores([]);
            setSelectedMocaScore(null);
            return;
        }

        const filtered = testResults.filter((result) => result.patient_id === selectedPatient.patient_id);

        // Group MoCA Scores by date
        const groupedScores: { [key: string]: number } = {};
        filtered.forEach((result) => {
            if (!groupedScores[result.date]) groupedScores[result.date] = 0;
            groupedScores[result.date] += result.aggregated_score;
        });

        // Convert grouped scores to an array for graphing
        const mocaScoreData = Object.keys(groupedScores).map((date) => ({
            date,
            score: groupedScores[date]
        }));

        // Get MoCA Score for the selected date
        const selectedScore = groupedScores[date] || 0;

        // Filter results only for the selected date
        const resultsForSelectedDate = filtered.filter((res) => res.date === date);

        setFilteredResults(resultsForSelectedDate);
        setMocaScores(mocaScoreData);
        setSelectedMocaScore(selectedScore);
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        router.push("/login");
    };

    // Chart Data for MoCA Scores
    const chartData = {
        labels: mocaScores.map((data) => data.date),
        datasets: [
            {
                label: "MoCA Score Over Time",
                data: mocaScores.map((data) => data.score),
                borderColor: "#6B6651",
                backgroundColor: "rgba(107, 102, 81, 0.2)",
                borderWidth: 2,
                pointBackgroundColor: "#504B38"
            }
        ]
    };

    // Add new state for patient search and list
    const [patientId, setPatientId] = useState("");
    const [patientList, setPatientList] = useState<Patient[]>([]);
    const [searchError, setSearchError] = useState("");

    // Add patient search function
    const handlePatientSearch = async () => {
        try {
            setSearchError("");
            const patientData = await patientApi.getPatientById(patientId);
            
            // Check if patient already exists in list
            if (!patientList.find(p => p.patient_id === patientData.patient_id)) {
                setPatientList(prev => [...prev, patientData]);
            }
            
            setPatientId(""); // Clear input after successful search
        } catch (error) {
            setSearchError("Patient not found or error occurred");
            console.error('Error fetching patient:', error);
        }
    };

    // Add patient removal function
    const removePatient = (patientId: string) => {
        setPatientList(patientList.filter(p => p.patient_id !== patientId));
    };

    return (
        <div className="bg-[#F8F3D9] min-h-screen p-6">
            {/* Navbar */}
            <nav className="bg-[#F8F3D9] p-4 flex justify-between items-center shadow-lg">
                <div className="flex space-x-4">
                    {/* Patient ID Search */}
                    <input
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        placeholder="Enter Patient ID"
                        className="p-2 w-40 border border-[#B9B28A] rounded text-[#504B38] placeholder-[#8A8467] focus:ring-2 focus:ring-[#504B38] focus:outline-none bg-white"
                    />
                    <button
                        onClick={handlePatientSearch}
                        className="bg-[#6B6651] text-white px-6 py-2 rounded-lg hover:bg-[#504B38] transition"
                    >
                        Search Patient
                    </button>
                </div>
                
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </nav>

            {/* Patient List */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-[#504B38] mb-4">Patient List</h2>
                
                {searchError && (
                    <p className="text-red-500 mb-4">{searchError}</p>
                )}

                {patientList.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#B9B28A]">
                                    <th className="p-2 text-[#504B38]">Patient ID</th>
                                    <th className="p-2 text-[#504B38]">First Name</th>
                                    <th className="p-2 text-[#504B38]">Last Name</th>
                                    <th className="p-2 text-[#504B38]">Email</th>
                                    <th className="p-2 text-[#504B38]">Phone</th>
                                    <th className="p-2 text-[#504B38]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientList.map((patient) => (
                                    <tr key={patient.patient_id} className="border-b border-[#EAE2C8] hover:bg-[#F8F3D9]">
                                        <td className="p-2 text-[#504B38]">{patient.patient_id}</td>
                                        <td className="p-2 text-[#504B38]">{patient.first_name}</td>
                                        <td className="p-2 text-[#504B38]">{patient.last_name}</td>
                                        <td className="p-2 text-[#504B38]">{patient.email}</td>
                                        <td className="p-2 text-[#504B38]">{patient.phone}</td>
                                        <td className="p-2">
                                            <button
                                                onClick={() => removePatient(patient.patient_id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-[#8A8467] text-center">No patients added to the list.</p>
                )}
            </div>

            {/* KPI - MoCA Score Chart */}
            <div className="mt-6 p-6 bg-white rounded-lg shadow-lg text-center">
                <h3 className="text-xl font-bold text-[#504B38] mb-4">MoCA Score Trend</h3>

                {mocaScores.length > 0 ? (
                    <div className="w-[600px] h-[300px] mx-auto">
                        <Line
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false
                            }}
                        />
                    </div>
                ) : (
                    <p className="text-[#8A8467]">No data available</p>
                )}

                {selectedMocaScore !== null && (
                    <p className="text-lg font-bold mt-4 text-[#6B6651]">
                        MoCA Score on {date}: <span className="text-2xl">{selectedMocaScore.toFixed(2)}</span>
                    </p>
                )}
            </div>

            {/* Filtered Test Results */}
            <div className="mt-6 bg-white/30 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-[#504B38] text-center mb-4">Test Results for {date}</h2>
                {filteredResults.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#B9B28A]">
                                <th className="p-2 text-[#504B38]">Test ID</th>
                                <th className="p-2 text-[#504B38]">Subtest Name</th>
                                <th className="p-2 text-[#504B38]">Aggregated Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.map((result, index) => (
                                <tr key={index} className="border-b border-[#EAE2C8] hover:bg-[#F8F3D9]">
                                    <td className="p-2 text-[#504B38]">{result.test_id}</td>
                                    <td className="p-2 text-[#504B38]">{result.subtest_name}</td>
                                    <td className="p-2 text-[#504B38]">{result.aggregated_score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-[#8A8467] text-center">No results found.</p>
                )}
            </div>
        </div>
    );
}
