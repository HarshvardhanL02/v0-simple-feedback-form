import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return 403 Forbidden for all requests
  return res.status(403).json({ success: false, message: "Access denied" })
}
