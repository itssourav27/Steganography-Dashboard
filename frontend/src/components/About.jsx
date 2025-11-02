import "../css/About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>About Us</h1>
        <p>All-in-one file conversion made easy</p>
      </div>

      <div className="about-content">
        <p>
          At <strong>Cue7ven File Converter</strong>, we aim to make file
          conversion effortless for everyone — whether you're a student,
          professional, or just someone trying to make sense of formats.
        </p>
        <p>Our platform supports a wide range of conversions including:</p>
        <ul>
          <li>Documents (PDF to Word, PDF to Image)</li>
          <li>Images (JPG, PNG, BMP, WBMP)</li>
          <li>More formats coming soon!</li>
        </ul>
        <p>
          With a clean interface, secure upload, and instant download, we
          prioritize your experience and privacy. No signups, no watermarks,
          just fast and reliable conversions.
        </p>
      </div>

      <div className="about-footer">
        <p>Developed with 💙 by the Cue7ven team.</p>
        <p>
          Visit our main site:{" "}
          <a href="https://cue7ven.com/" target="_blank" rel="noreferrer">
            cue7ven.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default About;
