import React, { useState, useEffect } from "react";
import "../css/Body.css";
import ConverterContainer from "./ConverterContainer";
import cartoon from "/Researching-amico.svg";

const Body = () => {
  const [cartoonLoaded, setCartoonLoaded] = useState(false);
  const [cartoonError, setCartoonError] = useState(false);

  const handleCartoonLoad = () => {
    setCartoonLoaded(true);
    setCartoonError(false);
  };

  const handleCartoonError = () => {
    setCartoonError(true);
    setCartoonLoaded(false);
    console.warn("Cartoon image failed to load");
  };

  const [converterError, setConverterError] = useState(false);

  useEffect(() => {
    setConverterError(false);
  }, []);

  return (
    <main role="main">
      <section className="main-content">
        <div className="drop-section">
          <div className="info-section">
            <div className="title-section">
              <h1>Convert Free</h1>
              <h2>Online Converter Files</h2>
              <p>
                Easily convert documents, eBooks, images, PDFs.
                <br />
                All-in-one platform for all your file conversion needs.
              </p>
            </div>
            <div className="drop-box"></div>
          </div>

          <div className="cartoon">
            {!cartoonError ? (
              <img
                src={cartoon}
                className={`cartoon-img ${
                  cartoonLoaded ? "loaded" : "loading"
                }`}
                alt="Person researching file conversion - illustration"
                onLoad={handleCartoonLoad}
                onError={handleCartoonError}
                loading="lazy"
              />
            ) : (
              <div
                className="cartoon-fallback"
                aria-label="File conversion illustration"
              >
                📁 ➔ 📄
              </div>
            )}
          </div>
        </div>

        <section
          className="recommend-section"
          aria-labelledby="converter-heading"
        >
          <h2 id="converter-heading" className="sr-only">
            File Converters
          </h2>
          <div className="recommend-cnt">
            {!converterError ? (
              <ErrorBoundary onError={() => setConverterError(true)}>
                <ConverterContainer />
              </ErrorBoundary>
            ) : (
              <div className="converter-error">
                <p>Unable to load converters. Please refresh the page.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ConverterContainer Error:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default Body;
