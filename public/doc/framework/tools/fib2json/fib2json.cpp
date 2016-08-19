//g++ -o fib2json main.cpp -I ./ -lboost_program_options -lboost_filesystem -lboost_system -static

#include <algorithm>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <math.h>

// Use filesystem version 2 for compatibility with newer boost versions.
#ifndef BOOST_FILESYSTEM_VERSION
    #define BOOST_FILESYSTEM_VERSION 2
#endif

#include <boost/algorithm/string.hpp>
#include <boost/filesystem.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/program_options.hpp>

float switchByteOrder( const float value )
{
    size_t numBytes = sizeof( float );
    float result = value;
    if( numBytes == 1 )
    {
        return result;
    }
    char *s  = reinterpret_cast< char* >( &result );
    for( size_t i = 0; i < numBytes / 2; ++i )
    {
        std::swap( s[i], s[ ( numBytes - 1 ) - i ] );
    }
    return result;
}

void switchByteOrderOfArray( float *array, const size_t arraySize )
{
    for( size_t i = 0; i < arraySize; ++i )
    {
        array[i] = switchByteOrder( array[i] );
    }
}

uint32_t switchByteOrder2( const uint32_t value )
{
    size_t numBytes = sizeof( uint32_t );
    uint32_t result = value;
    char *s  = reinterpret_cast< char* >( &result );
    for( size_t i = 0; i < numBytes / 2; ++i )
    {
        std::swap( s[i], s[ ( numBytes - 1 ) - i ] );
    }
   //std::cout << value << " " << result << std::endl;
    return result;
}

void switchByteOrderOfArray2( uint32_t *array, const size_t arraySize )
{
    for( size_t i = 0; i < arraySize; ++i )
    {
        array[i] = switchByteOrder2( array[i] );
    }
}

/**
 * The main routine starting up the whole application.
 */
int main( int argc, char** argv )
{
	using namespace std;

	/**********************************************************************************************************
	 *
	 * process command line options
	 *
	 **********************************************************************************************************/

	// process user parameter
	namespace po = boost::program_options; // since the namespace is far to big we use a shortcut here
	namespace ba = boost::algorithm;
	po::options_description desc( "Options:" );
	bool bflipx = false;
	bool bflipy = false;
	bool bflipz = false;
	float shiftx = 0.0;
	float shifty = 0.0;
	float shiftz = 0.0;


	desc.add_options()
		( "help,h", "Prints this help message" )
		( "version,v", "Prints the version information" )
		( "input,i", po::value< std::string >(), "input fib file" )
		( "output,o", po::value< std::string >(), "output json file" )
	    ( "flipx,x", "flipx" )
	    ( "flipy,y", "flipy" )
	    ( "flipz,z", "flipz" )
	    ( "shiftx,r", po::value< float >(), "shiftx" )
	    ( "shifty,g", po::value< float >(), "shifty" )
		( "shiftz,b", po::value< float >(), "shiftz" );

	po::positional_options_description p;
	p.add( "input", -1 );

	boost::program_options::variables_map optionsMap;
	try
	{
		po::store( po::command_line_parser( argc, argv ).options( desc ).positional( p ).run(), optionsMap );
	}
	catch( const po::error &e )
	{
		std::cerr << e.what() << std::endl;
		return false;
	}

	po::notify( optionsMap );

	// print usage information if command line asks for help.
	if( optionsMap.count( "help" ) )
	{
		std::cout << "Converter fib -> json." << std::endl
				  << std::endl
				  << "Usage: track [OPTION]... [FILE]..." << std::endl
				  << std::endl
				  << desc << std::endl
				  << std::endl;
		return 0;
	}
	else if( optionsMap.count( "version" ) )
	{
		//printVersion();
		return 0;
	}
	if ( optionsMap.count( "flipx" ) )
	{
		bflipx = true;
	}
	if ( optionsMap.count( "flipy" ) )
	{
		bflipy = true;
	}
	if ( optionsMap.count( "flipz" ) )
	{
		bflipz = true;
	}
	if ( optionsMap.count( "shiftx" ) )
	{
		shiftx = optionsMap["shiftx"].as< float >();
	}
	if ( optionsMap.count( "shifty" ) )
	{
		shifty = optionsMap["shifty"].as< float >();
	}
	if ( optionsMap.count( "shiftz" ) )
	{
		shiftz = optionsMap["shiftz"].as< float >();
	}
	/**********************************************************************************************************
	 *
	 *
	 *
	 **********************************************************************************************************/
	if( optionsMap.count( "input" ) )
	{
		string filename = optionsMap["input"].as< string >();

		string suffix = boost::filesystem::path( filename ).extension();

		if( suffix == ".fib" )
		{
			cout << "loading " << filename << endl;
		}
		else
		{
			cout << "*** Error, no fib file specified ***" << endl;
			exit( 0 );
		}
		ifstream ifs(filename.c_str(), ifstream::in | ifstream::binary );
		if( ifs.bad() || !ifs.is_open() )
		{
			if( ifs.is_open() )
			{
				ifs.close();
			}
			cout <<  "internal error while opening" << endl;
			exit( 0 );
		}
		else
		{
			string line;
			vector<string>header;
			//std::getline( ifs, line, '\n' );

			for( int i = 0; i < 4; ++i )  // strip first four lines
			{
				std::getline( ifs, line, '\n' );
				header.push_back( line );
				//cout << line << endl;
			}

			if( header[0] != "# vtk DataFile Version 3.0" )
			{
				cout << "*** error *** format not supported" << endl;
			}
			if( header[1].size() > 256 )
			{
				cout << "Invalid header size of VTK fiber file: "
												   << filename
												   << ", max. 256 but got: "
												   << boost::lexical_cast< std::string >( header.at( 1 ).size() ) << endl;
			}

			if( header[2] != "BINARY" )
			{
				cout << "*** error *** format not supported" << endl;
			}
			/*
			if(  su::tokenize( m_header.at( 3 ) ).size() < 2 || su::toUpper( su::tokenize( m_header.at( 3 ) )[1] ) != "POLYDATA" )
			{
				wlog::error( "WReaderFiberVTK" ) << "Invalid fiber VTK DATASET type: " << su::tokenize( m_header.back() )[1];
			}
			 */

			std::getline( ifs, line, '\n' );
			vector< string > tokens;


			ba::split( tokens, line, ba::is_any_of( "\r\n\t " ) );
			if( !tokens.empty() )
			{
				// NOTE: moved the back() command to another if as if compiled on Windows, OW crashes since the compiler does not stop evaluation of the
				// condition after the first statement evaluates to false.
				if( tokens.back() == "" )
				{
					tokens.pop_back();
				}
			}

			string datatype = tokens[2];
			transform( tokens[2].begin(), tokens[2].end(), datatype.begin(), ::tolower );
			if( tokens.size() != 3 || datatype != "float" )
			{
				cout <<  "Invalid POINTS declaration: " << line << ", expected float."  << endl;
			}

			size_t numPoints = boost::lexical_cast< size_t >( tokens[1] );

			float *pointData = new float[ 3 * numPoints ];
			ifs.read( reinterpret_cast< char* >( pointData ), 3 * sizeof( float ) * numPoints );

			switchByteOrderOfArray( pointData, 3 * numPoints ); // all 4 bytes of each float are in wrong order we need to reorder them

			vector<float>points( pointData, pointData + 3 * numPoints );
			delete[] pointData;

			// since we know here the size of the vector we may allocate it right here
			//m_pointFiberMapping = boost::shared_ptr< std::vector< size_t > >( new std::vector< size_t > );
			//m_pointFiberMapping->reserve( numPoints );

			std::getline( ifs, line, '\n' );
			std::getline( ifs, line, '\n' );

			tokens.clear();
			ba::split( tokens, line, ba::is_any_of( "\r\n\t " ) );
			if( !tokens.empty() )
			{
				// NOTE: moved the back() command to another if as if compiled on Windows, OW crashes since the compiler does not stop evaluation of the
				// condition after the first statement evaluates to false.
				if( tokens.back() == "" )
				{
					tokens.pop_back();
				}
			}

			//cout << tokens[0] << " " << tokens[1] << " " << tokens[2] << endl;

			if( tokens.size() != 3 || tokens[0] != "LINES" )
			{
				cout <<  "Invalid VTK LINES declaration: " << line << endl;
			}
			size_t numLines = boost::lexical_cast< size_t >( tokens[1] );
			size_t linesSize = boost::lexical_cast< size_t >( tokens[2] );

			uint32_t *lineData = new uint32_t[ linesSize ];
			ifs.read( reinterpret_cast<char*>( lineData ), linesSize * sizeof( uint32_t ) );

			switchByteOrderOfArray2( lineData, linesSize );

			vector< size_t >fiberStartIndices;
			vector< size_t >fiberLengths;
			fiberStartIndices.reserve( numLines );
			fiberLengths.reserve( numLines );

//			for (size_t i = 0; i < linesSize/32; ++i) {
//				for (size_t j = 0; j < 8; ++j) {
//					cout << lineData[i*j] << " " << lineData[i*j+1] << " " << lineData[i*j+2] << " " << lineData[i*j+3] << " "
//							<< lineData[i*j+4] << " " << lineData[i*j+5] << " " << lineData[i*j+6] << " " << lineData[i*j+7] << " " << endl;
//				}
//			}

			// now convert lines with point numbers to real fibers
			size_t linesSoFar = 0;
			size_t pos = 0;
			size_t posInVerts = 0;
			while( linesSoFar < numLines )
			{
				fiberStartIndices.push_back( posInVerts );
				size_t fiberLength = lineData[pos];
				fiberLengths.push_back( fiberLength );
				//std::cout << "Length: " << fiberLength << endl;
				++pos;
				for( size_t i = 0; i < fiberLength; ++i )
				{
					++pos;
					++posInVerts;
				}
				++linesSoFar;
			}

			delete[] lineData;

			std::getline( ifs, line, '\n' );

			//bool success = !ii.eof();
			ifs.close();


			if( optionsMap.count( "output" ) )
			{
				for( size_t i = 0; i < points.size()/ 3; ++i )
				{
					if ( bflipx ) points[i*3]   *= -1.0f;
					if ( bflipy ) points[i*3+1] *= -1.0f;
					if ( bflipz ) points[i*3+2] *= -1.0f;
					points[i*3]   = points[i*3] + shiftx;
					points[i*3+1] = points[i*3+1] + shifty;
					points[i*3+2] = points[i*3+2] + shiftz;
				}

				string ofilename = optionsMap["output"].as< string >();
				std::ofstream dataFile( ofilename.c_str(), std::ios_base::binary );

				dataFile.setf( std::ios_base::fixed );
				dataFile.precision( 2 );

				dataFile << ( "{\n" );

				dataFile << ( "    \"vertices\" : [" );

				float fValue;
				for( size_t i = 0; i < (points.size() - 1 )/ 3; ++i )
				{
					fValue = points[i * 3];
					dataFile << fValue << ",";
					fValue = points[i * 3 + 1];
					dataFile << fValue << ",";
					fValue = points[i * 3 + 2];
					dataFile << fValue << ",";
				}
				fValue = points[points.size() - 3];
				dataFile << fValue << ",";
				fValue = points[points.size() - 2];
				dataFile << fValue << ",";
				fValue = points[points.size() - 1];
				dataFile << fValue << "],\n";

				dataFile << ( "    \"normals\" : [" );

				size_t pointPos = 0; // position in point array
				vector<float>tangent(3);
				vector<float>point(3);
				vector<float>pointNext(3);
				vector<float>pointBefore(3);
				vector<float>color(3);
				vector<float>globalColors;

				for( size_t i = 0; i < fiberLengths.size(); ++i )
				{
					for( size_t j = 0; j < fiberLengths[i]; ++j )
					{
						point[0] = points[pointPos*3];
						point[1] = points[pointPos*3+1];
						point[2] = points[pointPos*3+2];

						if( j == 0 ) // first point
						{
							pointNext[0] = points[(pointPos+1)*3];
							pointNext[1] = points[(pointPos+1)*3+1];
							pointNext[2] = points[(pointPos+1)*3+2];
							tangent[0] = point[0] - pointNext[0];
							tangent[1] = point[1] - pointNext[1];
							tangent[2] = point[2] - pointNext[2];
							globalColors.push_back( point[0] );
							globalColors.push_back( point[1] );
							globalColors.push_back( point[2] );
						}
						else if( j == fiberLengths[i] - 1 ) // last point
						{
							pointBefore[0] = points[(pointPos-1)*3];
							pointBefore[1] = points[(pointPos-1)*3+1];
							pointBefore[2] = points[(pointPos-1)*3+2];
							tangent[0] = pointBefore[0] - point[0];
							tangent[1] = pointBefore[1] - point[1];
							tangent[2] = pointBefore[2] - point[2];
							globalColors.push_back( point[0] );
							globalColors.push_back( point[1] );
							globalColors.push_back( point[2] );
						}
						else // somewhere in between
						{
							pointNext[0] = points[(pointPos+1)*3];
							pointNext[1] = points[(pointPos+1)*3+1];
							pointNext[2] = points[(pointPos+1)*3+2];
							pointBefore[0] = points[(pointPos-1)*3];
							pointBefore[1] = points[(pointPos-1)*3+1];
							pointBefore[2] = points[(pointPos-1)*3+2];
							tangent[0] = pointBefore[0] - pointNext[0];
							tangent[1] = pointBefore[1] - pointNext[1];
							tangent[2] = pointBefore[2] - pointNext[2];
						}
						++pointPos;

						float tlength = sqrt( tangent[0]*tangent[0] + tangent[1]*tangent[1] + tangent[2]*tangent[2] );

						dataFile << tangent[0]/tlength << "," << tangent[1]/tlength << "," << tangent[2]/tlength << ",";
					}
				}
				dataFile  << "0],\n";
				dataFile << ( "    \"colors\" : [" );
				for( size_t i = 0; i < fiberLengths.size(); ++i )
				{
					color[0] = globalColors[i*6] - globalColors[i*6+3];
					color[1] = globalColors[i*6+1] - globalColors[i*6+4];
					color[2] = globalColors[i*6+2] - globalColors[i*6+5];
					float clength = sqrt( color[0]*color[0] + color[1]*color[1] + color[2]*color[2] );
					color[0] /= clength;
					color[1] /= clength;
					color[2] /= clength;
					for( size_t j = 0; j < fiberLengths[i]; ++j )
					{
						fValue = std::max( color[0], color[0]*-1.0f);
						dataFile << fValue << ",";
						fValue = std::max( color[1], color[1]*-1.0f);
						dataFile << fValue << ",";
						fValue = std::max( color[2], color[2]*-1.0f);
						dataFile << fValue << ",1.0,";
					}
				}


				dataFile << "0],\n";

				int iValue;
				dataFile << ( "    \"indices\" : [" );

				for( size_t i = 0; i < fiberLengths.size() - 1; ++i )
				{
					iValue = fiberLengths[i];
					dataFile << iValue << ",";
				}
				iValue = fiberLengths[fiberLengths.size() - 1];
				dataFile << iValue << "]";

				dataFile <<  "\n}";

				dataFile.close();
			}
		}
	}
	else
	{
		cout << "*** Error, no input ***" << endl;
		exit( 0 );
	}
}

