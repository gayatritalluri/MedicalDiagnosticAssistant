import React, { useState } from 'react';
import "./DiagnosticAssistant.css"
const DiagnosticAssistant = () => {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageType, setImageType] = useState('chest');
  const [analysis, setAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Mock databases - same as original
  const mockSymptomDatabase = {
    'headache': {
      conditions: ['Migraine', 'Tension Headache', 'Sinusitis'],
      confidence: 0.85,
      urgency: 'Low'
    },
    'chest pain': {
      conditions: ['Angina', 'Gastric Reflux', 'Muscle Strain'],
      confidence: 0.92,
      urgency: 'High'
    },
    'cough': {
      conditions: ['Upper Respiratory Infection', 'Bronchitis', 'COVID-19'],
      confidence: 0.88,
      urgency: 'Medium'
    },
    'fever': {
      conditions: ['Viral Infection', 'Bacterial Infection', 'Inflammation'],
      confidence: 0.87,
      urgency: 'Medium'
    }
  };

  const mockImageAnalysis = {
    'chest': {
      finding: 'Potential opacity in right upper lobe',
      confidence: 0.85,
      recommendations: ['Follow-up chest X-ray', 'Pulmonary function test']
    },
    'brain': {
      finding: 'No significant abnormalities detected',
      confidence: 0.92,
      recommendations: ['Clinical correlation recommended']
    }
  };

  // Mock ML processing functions - same as original
  const processSymptoms = (symptomText) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const symptoms = symptomText.toLowerCase();
        let result = {
          conditions: [],
          confidence: 0,
          urgency: 'Low'
        };

        Object.entries(mockSymptomDatabase).forEach(([symptom, data]) => {
          if (symptoms.includes(symptom)) {
            result.conditions = [...result.conditions, ...data.conditions];
            result.confidence = Math.max(result.confidence, data.confidence);
            if (data.urgency === 'High') result.urgency = 'High';
            else if (data.urgency === 'Medium' && result.urgency === 'Low') {
              result.urgency = 'Medium';
            }
          }
        });

        if (result.conditions.length === 0) {
          result = {
            conditions: ['Non-specific symptoms detected'],
            confidence: 0.5,
            urgency: 'Low'
          };
        }

        resolve(result);
      }, 2000);
    });
  };

  const processImage = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockImageAnalysis[imageType]);
      }, 1500);
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target.result);
        };
        reader.readAsDataURL(file);
        setError(null);
      } else {
        setError('Please upload an image file');
      }
    }
  };

  const generateDiagnosis = async () => {
    setIsProcessing(true);
    setStep(2);

    try {
      const [symptomResults, imageResults] = await Promise.all([
        processSymptoms(symptoms),
        selectedImage ? processImage() : Promise.resolve(null)
      ]);

      setAnalysis({
        symptomAnalysis: symptomResults,
        imageAnalysis: imageResults,
        timestamp: new Date().toISOString()
      });

      setStep(3);
    } catch (err) {
      setError('Error processing diagnosis. Please try again.');
      setStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSymptoms('');
    setSelectedImage(null);
    setAnalysis(null);
    setError(null);
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.9) return 'confidence-high';
    if (score >= 0.7) return 'confidence-medium';
    return 'confidence-low';
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High': return 'urgency-high';
      case 'Medium': return 'urgency-medium';
      default: return 'urgency-low';
    }
  };

  return (
    <div className="diagnostic-container">
      {/* Header */}
      <div className="card header-card">
        <div className="card-header">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
              <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313-12.454z"></path>
              <path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2-2a2 2 0 0 0 2-2"></path>
              <path d="M19 11h2m-1-1v2"></path>
            </svg>
            Medical Diagnostic Assistant
          </h2>
        </div>
        <div className="card-content">
          <div className="step-container">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`step ${step >= stepNum ? 'active' : ''}`}
              >
                {stepNum}. {stepNum === 1 ? 'Input' : stepNum === 2 ? 'Analysis' : 'Results'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{error}</p>
          <button className="close-button" onClick={() => setError(null)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Input Section */}
      {step === 1 && (
        <div className="input-section">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Describe Your Symptoms</h3>
            </div>
            <div className="card-content">
              <textarea
                className="symptom-input"
                placeholder="Please describe your symptoms in detail..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upload Medical Images</h3>
            </div>
            <div className="card-content">
              <div className="upload-container">
                <select
                  className="image-type-select"
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value)}
                >
                  <option value="chest">Chest X-Ray</option>
                  <option value="brain">Brain MRI</option>
                </select>

                <label className="upload-label">
                  <div className="upload-area">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p>Click to upload or drag and drop</p>
                    <input
                      type="file"
                      className="hidden-input"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </label>

                {selectedImage && (
                  <div className="image-preview">
                    <img
                      src={selectedImage}
                      alt="Medical scan"
                      className="preview-image"
                    />
                    <button
                      className="remove-image"
                      onClick={() => setSelectedImage(null)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            className={`generate-button ${(!symptoms.trim() && !selectedImage) ? 'disabled' : ''}`}
            onClick={generateDiagnosis}
            disabled={!symptoms.trim() && !selectedImage}
          >
            Generate Diagnosis
          </button>
        </div>
      )}

      {/* Analysis Section */}
      {step === 2 && (
        <div className="card analysis-card">
          <div className="card-header">
            <h3 className="card-title">Processing Your Information</h3>
          </div>
          <div className="card-content">
            <div className="processing-container">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="processing-icon">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <p>Analyzing your symptoms and medical images...</p>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {step === 3 && analysis && (
        <div className="results-section">
          <div className="card results-card">
            <div className="card-header">
              <h3 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Diagnostic Results
              </h3>
            </div>
            <div className="card-content">
              <div className="results-container">
                {analysis.imageAnalysis && (
                  <div className="result-box">
                    <h4>Image Analysis</h4>
                    <p>{analysis.imageAnalysis.finding}</p>
                    <div className="recommendations">
                      <h5>Recommendations:</h5>
                      <ul>
                        {analysis.imageAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="result-box">
                  <h4>Potential Conditions</h4>
                  <ul>
                    {analysis.symptomAnalysis.conditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>

                <div className="metrics-container">
                  <div className="metric-box">
                    <h4>Confidence Score</h4>
                    <p className={getConfidenceColor(analysis.symptomAnalysis.confidence)}>
                      {(analysis.symptomAnalysis.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="metric-box">
                    <h4>Urgency Level</h4>
                    <p className={getUrgencyColor(analysis.symptomAnalysis.urgency)}>
                      {analysis.symptomAnalysis.urgency}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="disclaimer">
            <p>
              ⚠️ This is an AI-assisted preliminary analysis. Please consult with a healthcare professional for proper medical diagnosis and treatment. Generated on: {new Date(analysis.timestamp).toLocaleString()}
            </p>
          </div>

          <button
            className="reset-button"
            onClick={handleReset}
          >
            Start New Diagnosis
          </button>
        </div>
      )}
    </div>
  );
};

export default DiagnosticAssistant;
