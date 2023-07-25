import { createLoader } from 'simple-functional-loader'
import glob from 'fast-glob'
import * as url from 'url'
import * as path from 'path'
import * as fs from 'fs'
import Markdoc from '@markdoc/markdoc'
import yaml from 'js-yaml'

const __filename = url.fileURLToPath(import.meta.url)

// Used to display next and previous
function extractHrefObjects(data) {
  let hrefObjects = []

  // If data itself is an array, recursively extract from each item
  if (Array.isArray(data)) {
    for (let item of data) {
      hrefObjects = hrefObjects.concat(extractHrefObjects(item))
    }
    return hrefObjects
  }

  // Base case: If it's an object and has href, push it to results
  if (data && typeof data === 'object' && data.href) {
    delete data.type
    hrefObjects.push(data)
  }

  // If the object has a 'links' property and it's an array, iterate over it
  if (data.links && Array.isArray(data.links)) {
    for (let item of data.links) {
      hrefObjects = hrefObjects.concat(extractHrefObjects(item))
    }
  }

  return hrefObjects
}

function extractRedirects(data) {
  let redirects = []

  // If data itself is an array, recursively extract from each item
  if (Array.isArray(data)) {
    for (let item of data) {
      redirects = redirects.concat(extractRedirects(item))
    }
    return redirects
  }

  // Base case: If it's an object and has href, push it to results
  if (data && typeof data === 'object' && data.redirects) {
    redirects.push(data)
  }

  // If the object has a 'links' property and it's an array, iterate over it
  if (data.links && Array.isArray(data.links)) {
    for (let item of data.links) {
      redirects = redirects.concat(extractRedirects(item))
    }
  }

  return redirects
}

function convertToNextRedirects(data) {
  return data.flatMap((item) =>
    item.redirects
      .filter((redirect) => redirect !== item.href)
      .map((redirect) => ({
        source: redirect,
        destination: item.href,
        permanent: false,
      }))
  )
}

function getFrontmatterTitleRedirectsDocId(filepath) {
  const md = fs.readFileSync(filepath, 'utf8')
  const ast = Markdoc.parse(md)
  const frontmatter = ast.attributes.frontmatter
    ? yaml.load(ast.attributes.frontmatter)
    : {}
  return {
    title: frontmatter.title,
    redirects: frontmatter.redirects,
    docId: frontmatter.docId,
  }
}

function walkDir(dir, space, currentPath = '', includeRedirects = false) {
  let results = []
  const list = fs.readdirSync(dir)

  list.forEach((file) => {
    const filepath = path.join(dir, file)
    const stat = fs.statSync(filepath)
    const relativePath = path.join(currentPath, file)

    if (stat && stat.isDirectory()) {
      let indexFilepath = filepath + '/index.md'
      let title = file.charAt(0).toUpperCase() + file.slice(1)
      let redirects = null
      let docId = null
      if (fs.existsSync(indexFilepath)) {
        let {
          title: newTitle,
          redirects: newRedirects,
          docId: newDocId,
        } = getFrontmatterTitleRedirectsDocId(indexFilepath)
        title = newTitle
        redirects = newRedirects
        docId = newDocId
      }
      let entry = {
        title,
        docId,
        type: file,
        links: walkDir(filepath, space, relativePath, includeRedirects),
      }
      if (includeRedirects) {
        entry.redirects = redirects
      }
      if (fs.existsSync(indexFilepath)) {
        entry.href = `/${space}/${relativePath}`
      }
      results.push(entry)
    } else if (path.extname(file) === '.md' && file !== 'index.md') {
      let url = `${relativePath.replace(/\.md$/, '')}` // Remove .md extension
      let { title, redirects, docId } =
        getFrontmatterTitleRedirectsDocId(filepath)
      let entry = {
        title,
        docId,
        links: [],
        href: `/${space}/${url}`,
      }
      if (includeRedirects) {
        entry.redirects = redirects
      }
      results.push(entry)
    }
  })

  return results
}

export default function (nextConfig = {}) {
  let cache = new Map()

  return Object.assign({}, nextConfig, {
    webpack(config, options) {
      config.module.rules.push({
        test: __filename,
        use: [
          createLoader(function () {
            let pagesDir = path.resolve('./pages')
            this.addContextDependency(pagesDir)

            let dcs = walkDir(`${pagesDir}/dcs`, 'dcs')
            let node = walkDir(`${pagesDir}/node`, 'node')
            // TODO just calculate the next and prev when making the page
            let dcsBottomNav = extractHrefObjects(structuredClone(dcs))
            let nodeBottomNav = extractHrefObjects(structuredClone(node))

            // When this file is imported within the application
            // the following module is loaded:
            return `
              export const dcsNavigation = ${JSON.stringify(dcs)}
              export const nodeNavigation = ${JSON.stringify(node)}
              export const dcsBottomNav = ${JSON.stringify(dcsBottomNav)}
              export const nodeBottomNav = ${JSON.stringify(nodeBottomNav)}
            `
          }),
        ],
      })

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options)
      }

      return config
    },
    async redirects() {
      let pagesDir = path.resolve('./pages')
      let re = extractRedirects(walkDir(`${pagesDir}/dcs`, 'dcs', '', true))
      let dcs = convertToNextRedirects(re)
      let node = convertToNextRedirects(
        extractRedirects(walkDir(`${pagesDir}/node`, 'node', '', true))
      )
      let redirs = [...dcs, ...node]

      return redirs
      // TODO don't overwrite existing redirects
    },
  })
}