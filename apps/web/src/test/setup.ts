import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { clearSubjectCache } from "../api/subjectCache";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
  clearSubjectCache();
});