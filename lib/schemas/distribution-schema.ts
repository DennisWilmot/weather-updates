import { z } from "zod";

// Enum definitions
export const DISTRIBUTION_ITEMS = [
  "Starlink",
  "iPhones",
  "Powerbanks",
  "Food",
  "Water",
  "Box shelters",
  "Generators",
  "Hygiene kits",
  "Tarpaulin",
  "Cots",
  "Cleaning Kit",
  "Shelter Kit",
  "Food Kit",
  "Woman Care Kit",
  "Blanket",
  "Flashlight/Solar Light",
  "Mosquito Nets",
  "Other",
] as const;

export const RECIPIENT_SEX = ["Male", "Female"] as const;

// TypeScript interface
export interface DistributionFormSchema {
  // Section 1: General Information
  organizationName: string;
  distributionDate: Date;
  organizationEntity: string;

  // Section 2: Location
  parishId: string; // UUID reference to parishes.id
  communityId: string; // UUID reference to communities.id
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number; // GPS accuracy in meters

  // New: Entity References (preferred)
  assetId?: string; // UUID reference to assets.id (which asset was distributed)
  personId?: string; // UUID reference to people.id (who received it)
  placeId?: string; // UUID reference to places.id (where it was distributed)

  // Section 3: Items Distributed (legacy - will reference asset after migration)
  itemsDistributed?: string[]; // Array of items from DISTRIBUTION_ITEMS

  // Section 4: Recipient Information (legacy - will reference person after migration)
  recipientFirstName: string;
  recipientMiddleNames?: string;
  recipientLastName: string;
  recipientAlias?: string;
  recipientDateOfBirth: Date;
  recipientSex: "Male" | "Female";
  recipientTRN?: string; // Tax Registration Number
  recipientPhone?: string;

  // Section 5: Confirmation
  recipientSignature?: string; // Base64 image or URL

  // Metadata
  submittedBy: string; // User ID
}

// Zod validation schema
export const distributionSchema = z
  .object({
    // Organization Information
    organizationName: z.string().min(1, "Organization name is required"),
    distributionDate: z.date(),
    organizationEntity: z.string().min(1, "Organization entity is required"),

    // Location
    parishId: z.string().uuid("Invalid parish ID"),
    communityId: z.string().uuid("Invalid community ID"),
    latitude: z
      .number()
      .min(17.7, "Latitude must be within Jamaica bounds")
      .max(18.5, "Latitude must be within Jamaica bounds")
      .optional(),
    longitude: z
      .number()
      .min(-78.5, "Longitude must be within Jamaica bounds")
      .max(-76.2, "Longitude must be within Jamaica bounds")
      .optional(),
    altitude: z.number().optional(),
    accuracy: z.number().positive().optional(),

    // Entity References (preferred)
    assetId: z.string().uuid("Invalid asset ID").optional(),
    personId: z.string().uuid("Invalid person ID").optional(),
    placeId: z.string().uuid("Invalid place ID").optional(),

    // Items Distributed (legacy - required if assetId not provided)
    itemsDistributed: z
      .array(z.enum(DISTRIBUTION_ITEMS as unknown as [string, ...string[]]))
      .optional(),

    // Recipient Information
    recipientFirstName: z.string().min(1, "First name is required"),
    recipientMiddleNames: z.string().optional(),
    recipientLastName: z.string().min(1, "Last name is required"),
    recipientAlias: z.string().optional(),
    recipientDateOfBirth: z
      .date()
      .max(new Date(), "Date of birth cannot be in the future"),
    recipientSex: z.enum(RECIPIENT_SEX),
    recipientTRN: z.string().optional(),
    recipientPhone: z
      .string()
      .regex(
        /^(\+?1[-.\s]?)?\(?876\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
        "Invalid phone number format"
      )
      .optional(),

    // Signature
    recipientSignature: z.string().optional(),

    // Metadata
    submittedBy: z.string().min(1, "Submitted by is required"),
  })
  .refine(
    (data) => {
      // Either assetId or itemsDistributed must be provided
      return (
        data.assetId !== undefined ||
        (data.itemsDistributed !== undefined &&
          data.itemsDistributed.length > 0)
      );
    },
    {
      message: "Either asset ID or items distributed must be provided",
      path: ["assetId"],
    }
  )
  .refine(
    (data) => {
      // Either personId or recipient info must be provided
      return (
        data.personId !== undefined ||
        (data.recipientFirstName !== undefined &&
          data.recipientLastName !== undefined)
      );
    },
    {
      message: "Either person ID or recipient information must be provided",
      path: ["personId"],
    }
  );

// Type inference from Zod schema
export type DistributionForm = z.infer<typeof distributionSchema>;
