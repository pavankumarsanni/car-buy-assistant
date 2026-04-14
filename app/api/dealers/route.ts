import { NextRequest } from "next/server";

export type DealerListing = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  exteriorColor: string;
  inventoryType: "new" | "used" | "certified";
  dealBadge: "great" | "good" | "fair";
  dealer: {
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    distance: number;
    rating: number;
  };
};

const TRIM_MAP: Record<string, string[]> = {
  hyundai: ["SE Standard Range", "SEL", "Limited", "GT-Line"],
  toyota: ["LE", "XLE", "XSE", "Limited"],
  honda: ["LX", "EX", "EX-L", "Touring"],
  ford: ["XL", "XLT", "Lariat", "Platinum"],
  chevrolet: ["LS", "LT", "LTZ", "Premier"],
  bmw: ["sDrive28i", "xDrive28i", "M Sport", "xDrive40i"],
  mercedes: ["Base", "Premium", "AMG Line", "Exclusive"],
  default: ["Base", "Sport", "Premium", "Elite"],
};

const COLOR_MAP: Record<string, string[]> = {
  hyundai: ["Cyber Gray", "Lucid Blue", "Atlas White", "Gravity Gold Matte", "Optic White"],
  toyota: ["Midnight Black", "Blueprint", "Supersonic Red", "Wind Chill Pearl", "Cement"],
  honda: ["Sonic Gray Pearl", "Aegean Blue", "Platinum White Pearl", "Radiant Red", "Lunar Silver"],
  ford: ["Oxford White", "Carbonized Gray", "Rapid Red", "Atlas Blue", "Antimatter Blue"],
  default: ["Black", "White", "Silver", "Blue", "Red", "Gray"],
};

const PRICE_MAP: Record<string, { new: [number, number]; used: [number, number] }> = {
  "hyundai ioniq 5": { new: [41450, 56000], used: [32000, 44000] },
  "hyundai tucson": { new: [28000, 40000], used: [20000, 31000] },
  "toyota camry": { new: [27000, 38000], used: [18000, 28000] },
  "toyota rav4": { new: [30000, 42000], used: [22000, 34000] },
  "honda cr-v": { new: [31000, 43000], used: [23000, 35000] },
  "honda civic": { new: [24000, 32000], used: [16000, 24000] },
  "ford f-150": { new: [38000, 72000], used: [28000, 55000] },
  default: { new: [30000, 50000], used: [20000, 38000] },
};

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function rand(min: number, max: number, seed: number): number {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return Math.round(min + (s - Math.floor(s)) * (max - min));
}

function mockListings(make: string, model: string): DealerListing[] {
  const makeKey = make.toLowerCase();
  const modelKey = `${make} ${model}`.toLowerCase();

  const trims = TRIM_MAP[makeKey] ?? TRIM_MAP.default;
  const colors = COLOR_MAP[makeKey] ?? COLOR_MAP.default;
  const priceRange = PRICE_MAP[modelKey] ?? PRICE_MAP.default;
  const currentYear = new Date().getFullYear();

  const dealers = [
    { name: `AutoNation ${make} Beverly Hills`, address: "8741 Wilshire Blvd", city: "Beverly Hills", state: "CA", phone: "(310) 555-0142", distance: 3.2, rating: 4.5 },
    { name: `Park Place ${make}`, address: "2055 S Sepulveda Blvd", city: "Los Angeles", state: "CA", phone: "(310) 555-0187", distance: 7.8, rating: 4.2 },
    { name: `South Bay ${make}`, address: "3611 Pacific Coast Hwy", city: "Torrance", state: "CA", phone: "(310) 555-0231", distance: 12.4, rating: 4.4 },
    { name: `${make} World of Torrance`, address: "19400 Hawthorne Blvd", city: "Torrance", state: "CA", phone: "(310) 555-0098", distance: 18.9, rating: 3.8 },
    { name: `Pacific ${make}`, address: "1430 E Colorado Blvd", city: "Pasadena", state: "CA", phone: "(626) 555-0174", distance: 22.1, rating: 4.1 },
    { name: `${make} of Pasadena`, address: "600 E Colorado Blvd", city: "Pasadena", state: "CA", phone: "(626) 555-0219", distance: 28.7, rating: 4.6 },
  ];

  const templates: Array<{ type: DealerListing["inventoryType"]; badge: DealerListing["dealBadge"]; yearOffset: number; trimIdx: number }> = [
    { type: "new",       badge: "great",     yearOffset: 0, trimIdx: 0 },
    { type: "new",       badge: "good",      yearOffset: 0, trimIdx: 1 },
    { type: "certified", badge: "great",     yearOffset: 1, trimIdx: 0 },
    { type: "new",       badge: "fair",      yearOffset: 0, trimIdx: 3 },
    { type: "used",      badge: "good",      yearOffset: 1, trimIdx: 0 },
    { type: "certified", badge: "great",     yearOffset: 1, trimIdx: 1 },
  ];

  return templates.map((t, i) => {
    const isNew = t.type === "new";
    const year = currentYear - t.yearOffset;
    const basePrice = isNew ? priceRange.new[0] : priceRange.used[0];
    const maxPrice = isNew ? priceRange.new[1] : priceRange.used[1];
    const trimOffset = t.trimIdx * Math.floor((maxPrice - basePrice) / 4);
    const price = rand(basePrice + trimOffset, basePrice + trimOffset + 3000, i * 7 + 3);
    const mileage = isNew ? rand(5, 30, i * 3) : rand(8000, 45000, i * 11 + 5);

    return {
      id: `mock-${makeKey}-${i}`,
      year,
      make,
      model,
      trim: pick(trims, t.trimIdx),
      price,
      mileage,
      exteriorColor: pick(colors, i),
      inventoryType: t.type,
      dealBadge: t.badge,
      dealer: dealers[i],
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get("make") ?? "";
  const model = searchParams.get("model") ?? "";

  if (!make || !model) {
    return Response.json({ error: "make and model are required" }, { status: 400 });
  }

  // Simulate a brief network delay so the loading state is visible
  await new Promise((r) => setTimeout(r, 600));

  const listings = mockListings(make, model);
  return Response.json({ listings });
}
