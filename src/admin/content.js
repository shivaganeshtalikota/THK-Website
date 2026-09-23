import { createContext, useContext } from 'react'

export const SITE = 'https://www.talikotaharikrishna.com'

/**
 * Everything published, as the repository has it RIGHT NOW — read from the
 * latest commit, not from the deployed site, so a change shows up in the
 * console the moment it is saved rather than a couple of minutes later.
 * Provided by Shell.
 */
export const ContentContext = createContext(null)
export const useContent = () => useContext(ContentContext)
