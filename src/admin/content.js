import { createContext, useContext } from 'react'

export const SITE = 'https://www.talikotaharikrishna.com'
export const ITDP_SITE = 'https://itdptelangana.com'

/** Where campaign posters are published — iTDP once they have moved. */
export const posterSite = (content) => (content?.postersSite === 'itdp' ? ITDP_SITE : SITE)

/**
 * Everything published, as the repository has it RIGHT NOW — read from the
 * latest commit, not from the deployed site, so a change shows up in the
 * console the moment it is saved rather than a couple of minutes later.
 * Provided by Shell.
 */
export const ContentContext = createContext(null)
export const useContent = () => useContext(ContentContext)
