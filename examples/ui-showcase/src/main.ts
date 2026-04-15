import { bootLitoClient } from "@litoho/app";
import "./styles.css";
import { pageManifest } from "./generated/page-manifest.js";

bootLitoClient({ pageManifest });
