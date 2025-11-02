import png from "/png.png";
import pdf from "/pdf.png";
import jpg from "/jpg.png";
import image from "/image.png";
import bmp from "/bmp.png";
import webp from "/WebP.png";
import gif from "/gif.gif";
import avif from "/avif.png";

export const Converter_List = [
  {
    logo: png,
    title: "PDF to Image",
    info: "Convert PDF files to set of optimised image",
    targetFormat: "images",
    sourceFormat: "pdf",
    endpoint: "pdf-convert",
  },
  {
    logo: pdf,
    title: "PDF to Word",
    info: "Convert your PDF to Word with great accuracy",
    targetFormat: "docx",
    sourceFormat: "pdf",
    endpoint: "pdf-convert",
  },
  {
    logo: jpg,
    title: "Image to JPG",
    info: "Convert Images in JPG in seconds",
    targetFormat: "jpg",
    sourceFormat: "image",
    acceptedFormats: ["png", "bmp", "gif", "webp", "avif", "tiff"],
    endpoint: "img-convert",
  },
  {
    logo: image,
    title: "Images to PNG",
    info: "Convert Images to PNG in seconds",
    targetFormat: "png",
    sourceFormat: "image",
    acceptedFormats: ["jpg", "jpeg", "bmp", "gif", "webp", "avif", "tiff"],
    endpoint: "img-convert",
  },
  {
    logo: bmp,
    title: "Images to BMP",
    info: "Convert Images to BMP in seconds",
    targetFormat: "bmp",
    sourceFormat: "image",
    acceptedFormats: ["jpg", "jpeg", "png", "gif", "webp", "avif", "tiff"],
    endpoint: "img-convert",
  },
  {
    logo: webp,
    title: "Images to WebP",
    info: "Convert Images to WebP in seconds",
    targetFormat: "webp",
    sourceFormat: "image",
    acceptedFormats: ["jpg", "jpeg", "png", "bmp", "gif", "avif", "tiff"],
    endpoint: "img-convert",
  },
  {
    logo: gif,
    title: "Images to GIF",
    info: "Convert Images to GIF in seconds",
    targetFormat: "gif",
    sourceFormat: "image",
    acceptedFormats: ["jpg", "jpeg", "png", "bmp", "webp", "avif", "tiff"],
    endpoint: "img-convert",
  },
  {
    logo: avif,
    title: "Images to AVIF",
    info: "Convert Images to AVIF in seconds",
    targetFormat: "avif",
    sourceFormat: "image",
    acceptedFormats: ["jpg", "jpeg", "png", "bmp", "gif", "webp", "tiff"],
    endpoint: "img-convert",
  },
];

export const FORMAT_MAPPINGS = {
  "JPG to PNG": { source: "jpg", target: "png" },
  "PNG to JPG": { source: "png", target: "jpg" },
  "JPG to BMP": { source: "jpg", target: "bmp" },
  "PNG to BMP": { source: "png", target: "bmp" },
  "BMP to PNG": { source: "bmp", target: "png" },
  "BMP to JPG": { source: "bmp", target: "jpg" },
  "JPG to GIF": { source: "jpg", target: "gif" },
  "PNG to GIF": { source: "png", target: "gif" },
  "BMP to GIF": { source: "bmp", target: "gif" },
  "GIF to JPG": { source: "gif", target: "jpg" },
  "GIF to PNG": { source: "gif", target: "png" },
  "GIF to BMP": { source: "gif", target: "bmp" },
  "JPG to WebP": { source: "jpg", target: "webp" },
  "PNG to WebP": { source: "png", target: "webp" },
  "WebP to JPG": { source: "webp", target: "jpg" },
  "WebP to PNG": { source: "webp", target: "png" },
  "JPG to AVIF": { source: "jpg", target: "avif" },
  "PNG to AVIF": { source: "png", target: "avif" },
  "AVIF to JPG": { source: "avif", target: "jpg" },
  "AVIF to PNG": { source: "avif", target: "png" },
};

export const SUPPORTED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "bmp",
  "gif",
  "webp",
  "avif",
  "pdf",
  "docx",
  "doc",
];

export const MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  bmp: "image/bmp",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
};
