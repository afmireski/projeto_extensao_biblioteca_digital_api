using TypeSpec.Http;

namespace BibliotecaDigital;

/** A single page belonging to an edition, with OCR processing status. */
model Page {
  id: string;
  edition_id: string;
  number: int32;
  display_image_url: string | null;
  thumb_image_url: string | null;
  ocr_status: string;
  ocr_confidence: float32 | null;
}

model PageFilters {
  edition_id: {
    eq: string;
  };
}

model PageOrder {
  number?: "asc" | "desc";
}

model ListPagesResult {
  data: Page[];
  meta: {
    total: int32;
    page: int32;
    limit: int32;
    total_pages: int32;
  };
}
