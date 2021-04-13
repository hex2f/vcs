#include <unistd.h>
#include <fcntl.h>

char *getcwd(char *buffer, size_t size)
{
	if (size < 2) return 0;
	buffer[0] = '/';
	buffer[1] = 0;
	return buffer;
}

char *realpath(char *path, char *result)
{
	char *resolved = result;
	
	if (*path != '/')
	{
		*resolved = '/';
		resolved++;
	}
	
	for (int i = 0 ; 1 ; i++)
	{
		char ch = path[i];
		if (!ch) break;
		resolved[i] = ch;
	}
	
	return result;
}

int mkstemp(char *path) { return -2; }
