import { z } from "zod";

export const availableAssetSchema = z.object({
  organizationName: z.string().min(1),
  organizationEntity: z.string().min(1),

  assetType: z.string().min(1),

  assetName: z.string().min(1),

  // convert string → number
  assetQuantity: z.coerce.number().min(1, "Quantity must be at least 1"),

  parishId: z.string().min(1),
  communityId: z.string().optional(),

  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  altitude: z.coerce.number().optional(),
  accuracy: z.coerce.number().optional(),

  submittedBy: z.string().optional(),
});
