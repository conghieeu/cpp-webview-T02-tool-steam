# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file LICENSE.rst or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION ${CMAKE_VERSION}) # this file comes with cmake

# If CMAKE_DISABLE_SOURCE_CHANGES is set to true and the source directory is an
# existing directory in our source tree, calling file(MAKE_DIRECTORY) on it
# would cause a fatal error, even though it would be a no-op.
if(NOT EXISTS "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-src")
  file(MAKE_DIRECTORY "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-src")
endif()
file(MAKE_DIRECTORY
  "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-build"
  "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-subbuild/webview-populate-prefix"
  "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-subbuild/webview-populate-prefix/tmp"
  "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-subbuild/webview-populate-prefix/src/webview-populate-stamp"
  "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-subbuild/webview-populate-prefix/src"
  "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-subbuild/webview-populate-prefix/src/webview-populate-stamp"
)

set(configSubDirs Debug)
foreach(subDir IN LISTS configSubDirs)
    file(MAKE_DIRECTORY "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-subbuild/webview-populate-prefix/src/webview-populate-stamp/${subDir}")
endforeach()
if(cfgdir)
  file(MAKE_DIRECTORY "D:/cpp-webview/cpp-webview-T02/build/_deps/webview-subbuild/webview-populate-prefix/src/webview-populate-stamp${cfgdir}") # cfgdir has leading slash
endif()
